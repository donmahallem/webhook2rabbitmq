/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

import express from 'express';
import { Server } from 'http';
import { AmqHandler } from './amq-handler';
import { Config } from './config';
import { createWebhookRouter } from './router';


export class WRServer {
    public readonly app: express.Application;
    private readonly amqHandler: AmqHandler;
    private server: Server;
    public constructor() {
        this.amqHandler = new AmqHandler({
            hostname: Config.AMQ_HOSTNAME,
            password: Config.AMQ_PASSWORD,
            port: Config.AMQ_PORT,
            protocol: Config.AMQ_PROTOCOL,
            username: Config.AMQ_PASSWORD,
            vhost: Config.AMQ_VHOST,
        }, Config.AMQ_QUEUE);
        this.app = express();
        this.app.use(Config.API_PATH, createWebhookRouter(this.amqHandler, Config.GITHUB_SECRET));
    }

    public start(): Promise<void> {
        if (this.server && this.server.listening) {
            throw new Error('Server is already listening');
        }
        return new Promise((res: (arg: void) => void) => {
            this.server = this.app.listen(Config.API_PORT, (): void => {
                res();
            });
        });
    }

    public async stop(): Promise<void> {
        await new Promise((res: (arg: void) => void, rej: (err: any) => void) => {
            this.server.close((err: any): void => {
                err ? rej(err) : res();
            });
        });
        await this.amqHandler.close();
    }
}
