/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

import { verify } from '@octokit/webhooks-methods';
import { text } from 'body-parser';
import express, { Router } from 'express';
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
type GithubWebhookRequest = express.Request<Record<string, never>, any, string> & { headers: GithubRequestHeaders };
/**
 * Creates an validation request handler
 *
 * @param {string} secret
 * @returns {express.RequestHandler} Request Handler
 */
export function validateRequest(secret: string | undefined): express.RequestHandler {
    return (req: GithubWebhookRequest, res: express.Response, next: express.NextFunction): void => {
        if (req.is(['json', 'text/plain']) === false) {
            next(new HttpError('Invalid request type', 400));
            return;
        }
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
                next(new HttpError('Missing signature', 400));
                return;
            }
            verify(secret, req.body, req.headers['x-hub-signature-256'])
                .then((verifyResult: boolean): void => {
                    if (verifyResult) {
                        next();
                    } else {
                        next(new HttpError('Invalid signature', 401));
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
export function createWebhookRouter(amqHandler: AmqHandler, secret: string | undefined): express.Router {
    const route: express.Router = Router();
    route.post<''>(
        '',
        text({ defaultCharset: 'utf-8', type: ['text/plain', 'application/json'] }),
        validateRequest(secret),
        (req: GithubWebhookRequest, res: express.Response, next: express.NextFunction): void => {
            if (typeof req.body !== 'string' || req.body?.length === 0) {
                next(new HttpError('Empty body', 400));
                return;
            }
            let parsedBody: Record<string, unknown>;
            try {
                parsedBody = JSON.parse(req.body) as Record<string, unknown>;
            } catch (err: any) {
                next(new HttpError('Invalid JSON', 400));
                return;
            }
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
                .catch((err: any | Error): void => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                    next(new HttpError(err?.message || 'Upstream error', 503));
                });
        }
    );
    route.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {

        if (process.env.NODE_ENV !== 'debug') {
            console.log(err);
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
    return route;
}
