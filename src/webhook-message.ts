/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

export interface IWebhookMesage<BASE = any> {
    event: string;
    id?: string;
    body: BASE;
}
