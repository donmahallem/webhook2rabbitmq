/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

import { verify } from '@octokit/webhooks-methods';
import { text } from 'body-parser';
import express from 'express';
import { AmqHandler } from './amq-handler';
import { HttpError } from './http-error';

type GithubRequestHeaders = {
    /**
     * GUID identifying the request
     */
    'x-github-delivery': string;
    /**
     * Event Name
     */
    'x-github-event': string;
    /**
     * Signature
     */
    'x-hub-signature-256'?: string;
};
/**
 * Creates an validation request handler
 *
 * @param {string} secret
 * @returns {express.RequestHandler} Request Handler
 */
export function validateRequest(secret: string | undefined): express.RequestHandler {
    return (req: express.Request & { headers: GithubRequestHeaders }, res: express.Response, next: express.NextFunction): void => {
        if (req.headers['x-github-event'] && typeof req.headers['x-github-event'] !== 'string') {
            res.sendStatus(400);
            return;
        }
        if (req.headers['x-github-delivery'] && typeof req.headers['x-github-delivery'] !== 'string') {
            res.sendStatus(400);
            return;
        }
        if (secret) {
            if (typeof req.headers['x-hub-signature-256'] !== 'string') {
                res.sendStatus(400);
                return;
            }
            verify(secret, req.body, req.headers['x-hub-signature-256'])
                .then((res: boolean): void => {
                    if (res) {
                        next();
                    } else {
                        next(new Error('Invalid request'));
                    }
                })
                .catch((err: any): void => {
                    next(err);
                });
            return;
        }
        next();
    };
}
/**
 * @param amqHandler
 * @param secret
 */
export function createServer(amqHandler: AmqHandler, secret: string | undefined): express.Application {
    const app: express.Application = express();
    app.post<'/api/webhooks/github'>(
        '/api/webhooks/github',
        text({ defaultCharset: 'utf-8', type: ['text/plain', 'application/json'] }),
        validateRequest(secret),
        (
            req: express.Request<Record<string, never>, string> & { headers: GithubRequestHeaders },
            res: express.Response,
            next: express.NextFunction
        ): void => {
            if (typeof req.body !== 'string') {
                res.sendStatus(400);
            }
            const parsedBody: Record<string, unknown> = JSON.parse(req.body) as Record<string, unknown>;
            const event: string = req.headers['x-github-event'];
            const id: string = req.headers['x-github-delivery'];
            amqHandler
                .send({
                    body: parsedBody,
                    event,
                    id,
                })
                .then((): void => {
                    res.status(200).json({ status: 200 });
                })
                .catch((err: any): void => {
                    next(err);
                });
        }
    );
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
        if (!err) {
            next();
            return;
        }
        if (err instanceof HttpError) {
            res.status(err.status).json({
                message: err.message,
                status: err.status,
            });
        } else if (err instanceof Error) {
            res.status(500).json({
                message: err.message,
                status: 500,
            });
        } else {
            res.status(500).json({
                message: 'Internal Server Error',
                status: 500,
            });
        }
    });
    return app;
}
