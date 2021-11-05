/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

import { Channel, Connection, connect } from 'amqplib';
import { IWebhookMesage } from './webhook-message';

/**
 * @param channel
 */
async function awaitDrain(channel: Channel): Promise<void> {
    return new Promise((res: (arg: void) => void): void => {
        channel.once('drain', () => res);
    });
}
export class AmqHandler {
    public constructor(private readonly connectionData: Parameters<typeof connect>[0], public readonly queueName: string) {}
    private channel: Channel;
    private connection: Connection;
    private async initChannel(): Promise<Channel> {
        if (!this.connection) {
            this.connection = await connect(this.connectionData);
        }
        if (!this.channel) {
            this.channel = await this.connection.createChannel();
        }
        return this.channel;
    }
    public async send(data: IWebhookMesage): Promise<void> {
        const dataChannel: Channel = await this.initChannel();
        const result: boolean = dataChannel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(data.body)), {
            contentType: 'application/json',
            messageId: data.id,
            type: data.event,
        });
        if (!result) {
            await awaitDrain(dataChannel);
        }
        return Promise.resolve();
    }

    public async close(): Promise<void> {
        if (this.channel) await this.channel.close();
        if (this.connection) await this.connection.close();
    }
}
