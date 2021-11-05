/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

import { expect } from 'chai';
import express from 'express';
import 'mocha';
import proxyquire from 'proxyquire';
import Sinon from 'sinon';
import supertest from 'supertest';
import * as AmqHandlerImport from './amq-handler';
import { createWebhookRouter } from './router';
import * as ServerImport from './server';
/* eslint-disable @typescript-eslint/no-explicit-any */
describe('server.ts', (): void => {
    describe('WRServer', (): void => {
        let sandbox: Sinon.SinonSandbox;
        let createRouterStub: Sinon.SinonStub<Parameters<typeof createWebhookRouter>, express.Router>;
        let testInstance: typeof ServerImport;
        before((): void => {
            sandbox = Sinon.createSandbox();
            createRouterStub = sandbox.stub();
            testInstance = proxyquire<typeof ServerImport>('./server', {
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
            const app: express.Application = new testInstance.WRServer({ amqConfig: '', queue: '' }).app;
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
    });
});
