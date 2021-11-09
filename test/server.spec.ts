/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

import axios, { AxiosError, AxiosResponse } from 'axios';
import { expect } from 'chai';
import express from 'express';
import 'mocha';
import proxyquire from 'proxyquire';
import Sinon from 'sinon';
import supertest from 'supertest';
import { WRServer } from './../src/';
import { AmqTestHandler } from './../src/am-test-client.spec';
import * as AmqHandlerImport from './../src/amq-handler';
import { createWebhookRouter } from './../src/router';
import * as ServerImport from './../src/server';
/* eslint-disable @typescript-eslint/no-explicit-any */
describe('server.ts', (): void => {
    describe('WRServer', (): void => {
        let sandbox: Sinon.SinonSandbox;
        let createRouterStub: Sinon.SinonStub<Parameters<typeof createWebhookRouter>, express.Router>;
        let testInstance: typeof ServerImport;
        before((): void => {
            sandbox = Sinon.createSandbox();
            createRouterStub = sandbox.stub();
            testInstance = proxyquire<typeof ServerImport>('./../src/server', {
                './amq-handler': {
                    WRServer: sandbox.createStubInstance(AmqHandlerImport.AmqHandler),
                },
                './router': {
                    createWebhookRouter: createRouterStub,
                },
            });
        });

        afterEach('test and reset promise stub', (): void => {
            sandbox.reset();
        });
        after((): void => {
            console.log("teardown");
            sandbox.restore();
        });
        it(`should not pass`, (): Promise<void> => {
            const r: express.Router = express.Router();
            r.post('/', (req, res, next) => {
                res.json({ a: true });
            });
            r.use('**', (req, res) => {
                console.log(req.baseUrl, req.path, req.body);
                res.status(404).json({ asdf: true });
            });
            createRouterStub.returns(r);
            const app: express.Application = new testInstance.WRServer().app;
            return supertest(app)
                .post('/api/webhooks/github')
                .send('TEST_PAYLOAD')
                .expect(200, { a: true })
                .expect('Content-Length', '10')
                .expect('Content-Type', /json/)
                .then((): void => {
                    expect(false).to.not.eq(1);
                });
        });
        describe('run', (): void => {
            let test: WRServer;
            let amqTestHandler: AmqTestHandler;
            const TEST_QUEUE_NAME: string = 'github_webhook';
            before('Setup server data', (): void => {
                process.env.AMQ_HOSTNAME = 'rabbitmq';
                process.env.AMQ_USERNAME = 'admin';
                process.env.AMQ_PASSWORD = 'admin';
                process.env.AMQ_QUEUE = TEST_QUEUE_NAME;
            });
            beforeEach('setup amq test', async (): Promise<void> => {
                amqTestHandler = new AmqTestHandler({
                    hostname: 'rabbitmq',
                    username: 'admin',
                    password: 'admin'
                }, TEST_QUEUE_NAME);
                await amqTestHandler.createQueue(TEST_QUEUE_NAME);
            });
            afterEach('teardown amq test handler', async (): Promise<void> => {
                await amqTestHandler.deleteQueue(TEST_QUEUE_NAME);
                await amqTestHandler.close();
            });
            after('reset server data', (): void => {
                process.env.AMQ_HOSTENAME = undefined;
                process.env.AMQ_USERNAME = undefined;
                process.env.AMQ_PASSWORD = undefined;
            });
            describe('Server without configured secret', (): void => {
                beforeEach('start server', async (): Promise<void> => {
                    test = new WRServer();
                    return await test.start();
                });
                afterEach('teardown server', async (): Promise<void> => {
                    return await test.stop();
                });

                it(`should not pass`, async (): Promise<void> => {
                    return axios.get('http://localhost:3000')
                        .then((): void => {
                            throw new Error('Should not be called');
                        })
                        .catch((err: AxiosError): void => {
                            expect(err.isAxiosError).be.true;
                            expect(err.response?.status).eq(404);
                        });
                });
                it(`should reject empty request body`, async (): Promise<void> => {
                    return axios.post('http://localhost:3000/api/webhooks/github',
                        undefined, {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-github-event': 'testtoken',
                        },
                    }).then((): void => {
                        throw new Error('Should not be called');
                    }).catch((err: AxiosError): void => {
                        expect(err.isAxiosError).be.true;
                        expect(err.response?.status).eq(400, 'Should return 400');
                        expect(err.response?.data).deep.eq({
                            message: 'Empty body',
                            status: 400,
                        });
                    });
                });
                it(`should reject invalid request body`, async (): Promise<void> => {
                    return axios.post('http://localhost:3000/api/webhooks/github',
                        'random_text', {
                        headers: {
                            'Content-Type': 'text/plain',
                            'x-github-event': 'testtoken',
                        },
                    }).then((): void => {
                        throw new Error('Should not be called');
                    }).catch((err: AxiosError): void => {
                        expect(err.isAxiosError).be.true;
                        expect(err.response?.status).eq(400, 'Should return 400');
                        expect(err.response?.data).deep.eq({
                            message: 'Invalid JSON',
                            status: 400,
                        });
                    });
                });
                it(`should store the message`, async (): Promise<void> => {
                    return axios.post('http://localhost:3000/api/webhooks/github',
                        { 'id': true }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-github-event': 'testtoken',
                        },
                    }).then(async (res: AxiosResponse): Promise<void> => {
                        expect(res.status).eq(200);
                        expect(res.data).to.deep.equal({ status: 200 });
                        expect(await amqTestHandler.get(TEST_QUEUE_NAME)).to.deep.equal({
                            "content": Buffer.from([
                                123,
                                34,
                                105,
                                100,
                                34,
                                58,
                                116,
                                114,
                                117,
                                101,
                                125,
                            ]),
                            "fields": {
                                "deliveryTag": 1,
                                "exchange": "",
                                "messageCount": 0,
                                "redelivered": false,
                                "routingKey": "github_webhook",
                            },
                            "properties": {
                                "appId": undefined,
                                "clusterId": undefined,
                                "contentEncoding": undefined,
                                "contentType": "application/json",
                                "correlationId": undefined,
                                "deliveryMode": undefined,
                                "expiration": undefined,
                                "headers": {},
                                "messageId": undefined,
                                "priority": undefined,
                                "replyTo": undefined,
                                "timestamp": undefined,
                                "type": "testtoken",
                                "userId": undefined,
                            }
                        });
                    });
                });
            });
            describe('Server without configured secret', (): void => {
                before('setup secret', (): void => {
                    process.env.GITHUB_SECRET = 'test_secret';
                });
                beforeEach('start server', async (): Promise<void> => {
                    test = new WRServer();
                    return await test.start();
                });
                afterEach('teardown server', async (): Promise<void> => {
                    return await test.stop();
                });
                after('restore secret', (): void => {
                });

                it(`should not pass`, async (): Promise<void> => {
                    return axios.get('http://localhost:3000')
                        .then((): void => {
                            throw new Error('Should not be called');
                        })
                        .catch((err: AxiosError): void => {
                            expect(err.isAxiosError).be.true;
                            expect(err.response?.status).eq(404);
                        });
                });
                it(`should reject empty request body`, async (): Promise<void> => {
                    return axios.post('http://localhost:3000/api/webhooks/github',
                        undefined, {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-github-event': 'testtoken',
                        },
                    }).then((): void => {
                        throw new Error('Should not be called');
                    }).catch((err: AxiosError): void => {
                        expect(err.isAxiosError).be.true;
                        expect(err.response?.status).eq(400, 'Should return 400');
                        expect(err.response?.data).deep.eq({
                            message: 'Missing signature',
                            status: 400,
                        });
                    });
                });
                it(`should not pass for missing 'x-hub-signature-256' header`, async (): Promise<void> => {
                    return axios.post('http://localhost:3000/api/webhooks/github',
                        'test', {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-github-delivery': '1243',
                        },
                    }).then((): void => {
                        throw new Error('Should not be called');
                    }).catch((err: AxiosError): void => {
                        expect(err.isAxiosError).be.true;
                        expect(err.response?.status).eq(400, 'Missing Signature');
                    });
                });
                it(`should not pass for invalid 'x-hub-signature-256' header`, async (): Promise<void> => {
                    return axios.post('http://localhost:3000/api/webhooks/github',
                        'test', {
                        headers: {
                            'Content-Type': 'application/json',
                            'x-github-delivery': '1243',
                            'x-hub-signature-256': 'random_secret',
                        },
                    }).then((): void => {
                        throw new Error('Should not be called');
                    }).catch((err: AxiosError): void => {
                        expect(err.isAxiosError).be.true;
                        expect(err.response?.status).eq(401, 'Invalid signature');
                    });
                });
            });
        });
    });
});
