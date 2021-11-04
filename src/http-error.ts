/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

export class HttpError extends Error {
    public constructor(message: string, public readonly status: number = 500) {
        super(message);
        this.name = 'HttpError';
    }
}
