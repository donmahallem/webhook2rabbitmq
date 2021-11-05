/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

import express from 'express';
import { Server } from 'http';
import { AmqHandler } from './amq-handler';
import { createWebhookRouter } from './router';

export interface IConfig {
    /**
     * amqConfig
     */
    amqConfig: ConstructorParameters<typeof AmqHandler>[0];
    /**
     * @default /api/webhooks/github
     */
    apiPath?: string;
    /**
     * port
     */
    port?: number;
    /**
     * queue
     */
    queue: string;
    /**
     * secret
     */
    secret?: string;
}

export class WRServer {
    public readonly app: express.Application;
    private readonly amqHandler: AmqHandler;
    private server: Server;
    public constructor(public readonly config: IConfig) {
        this.amqHandler = new AmqHandler(config.amqConfig, config.queue);
        this.app = express();
        this.app.use(config.apiPath || '/api/webhooks/github', createWebhookRouter(this.amqHandler, config.secret));
    }

    public start(): Promise<void> {
        if (this.server && this.server.listening) {
            throw new Error('Server is already listening');
        }
        return new Promise((res: (arg: void) => void) => {
            this.server = this.app.listen(this.config.port || 3000, (): void => {
                res();
            });
        });
    }

    public stop(): Promise<void> {
        return new Promise((res: (arg: void) => void, rej: (err: any) => void) => {
            this.server.close((err: any): void => {
                err ? rej(err) : res();
            });
        });
    }
}
