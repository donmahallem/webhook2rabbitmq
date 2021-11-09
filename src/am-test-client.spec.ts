/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

import { Channel, Connection, connect, GetMessage, Replies } from 'amqplib';

export class AmqTestHandler {
    public constructor(private readonly connectionData: Parameters<typeof connect>[0], public readonly queueName: string) { }
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
    public async createQueue(queue: string): Promise<Replies.AssertQueue> {
        const dataChannel: Channel = await this.initChannel();
        return await dataChannel.assertQueue(queue);
    }

    public async deleteQueue(queue: string): Promise<Replies.DeleteQueue> {
        const dataChannel: Channel = await this.initChannel();
        return dataChannel.deleteQueue(queue);
    }

    public async get(queue: string): Promise<GetMessage | false> {
        const dataChannel: Channel = await this.initChannel();
        return dataChannel.get(queue)
    }

    public async close(): Promise<void> {
        if (this.channel) await this.channel.close();
        if (this.connection) await this.connection.close();
    }
}
