/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

export class Config {
    /**
     * @default /api/webhooks/github
     */
    public static get API_PATH(): string {
        if (process.env.API_PATH) {
            return process.env.API_PATH;
        }
        return '/api/webhooks/github';
    }
    public static get API_PORT(): number {
        if (process.env.API_PORT) {
            return parseInt(process.env.API_PORT, 10);
        }
        return 3000;
    }
    public static get AMQ_USERNAME(): string {
        if (process.env.AMQ_USERNAME) {
            return process.env.AMQ_USERNAME;
        }
        return 'guest';
    }
    public static get AMQ_PASSWORD(): string {
        if (process.env.AMQ_PASSWORD) {
            return process.env.AMQ_PASSWORD;
        }
        return 'guest';
    }
    public static get AMQ_HOSTNAME(): string {
        if (process.env.AMQ_HOSTNAME) {
            return process.env.AMQ_HOSTNAME;
        }
        return 'localhost';
    }
    public static get AMQ_PROTOCOL(): string {
        if (process.env.AMQ_PROTOCOL) {
            return process.env.AMQ_PROTOCOL;
        }
        return 'amqp';
    }
    public static get AMQ_VHOST(): string {
        if (process.env.AMQ_VHOST) {
            return process.env.AMQ_VHOST;
        }
        return '/';
    }
    public static get AMQ_QUEUE(): string {
        if (process.env.AMQ_QUEUE) {
            return process.env.AMQ_QUEUE;
        }
        return 'github_webhook';
    }
    public static get AMQ_PORT(): number | undefined {
        if (process.env.AMQ_PORT) {
            return parseInt(process.env.AMQ_PORT, 10);
        }
        return undefined;
    }
    /**
     * The github secret
     */
    public static get GITHUB_SECRET(): string | undefined {
        if (process.env.GITHUB_SECRET) {
            return process.env.GITHUB_SECRET;
        }
        return undefined;
    }
}
