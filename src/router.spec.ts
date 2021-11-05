/*
 * Package @donmahallem/webhook2rabbitmq
 * Source https://github.com/donmahallem/webhook2rabbitmq
 */

import { sign } from '@octokit/webhooks-methods';
import { expect } from 'chai';
import express from 'express';
import 'mocha';
import Sinon from 'sinon';
import supertest from 'supertest';
import { AmqHandler } from './amq-handler';
import { createWebhookRouter } from './router';
/* eslint-disable @typescript-eslint/no-explicit-any */
describe('router.ts', (): void => {
    describe('createWebhookRouter', (): void => {
        let app: express.Application;
        const TEST_SECRETS: (string | undefined)[] = ['super_secret', undefined];
        const TEST_ROUTE = '/test/route';
        let sandbox: Sinon.SinonSandbox;
        before((): void => {
            sandbox = Sinon.createSandbox();
        });
        beforeEach((): void => {
            app = express();
        });
        afterEach('test and reset promise stub', (): void => {
            sandbox.reset();
        });
        after((): void => {
            sandbox.restore();
        });
        TEST_SECRETS.forEach((testSecret: string | undefined): void => {
            describe(`with${testSecret ? '' : 'out'} secret`, (): void => {
                let dataSignature: string | undefined;
                const TEST_PAYLOAD: string = JSON.stringify({ test: true });
                let handlerStub: Sinon.SinonStubbedInstance<AmqHandler>;
                before('setup AmqHandler stub', (): void => {
                    handlerStub = sandbox.createStubInstance<AmqHandler>(AmqHandler);
                });
                beforeEach(async (): Promise<void> => {
                    app.use(TEST_ROUTE, createWebhookRouter(handlerStub, testSecret));
                    dataSignature = testSecret ? await sign({ algorithm: 'sha256', secret: testSecret }, TEST_PAYLOAD) : undefined;
                });
                it(`should pass`, (): Promise<void> => {
                    handlerStub.send.resolves();
                    return supertest(app)
                        .post(TEST_ROUTE)
                        .set({
                            'content-type': 'application/json',
                            ...(dataSignature ? { 'x-hub-signature-256': dataSignature } : {}),
                            'x-github-event': 'testevent',
                        })
                        .send(TEST_PAYLOAD)
                        .expect(200, { status: 200 })
                        .expect('Content-Length', '14')
                        .expect('Content-Type', /json/)
                        .then((): void => {
                            expect(false).to.not.eq(1);
                        });
                });
                it(`should not pass`, (): Promise<void> => {
                    const TEST_ERROR: Error = new Error('test error');
                    handlerStub.send.rejects(TEST_ERROR);
                    return supertest(app)
                        .post(TEST_ROUTE)
                        .set({
                            'content-type': 'application/json',
                            ...(dataSignature ? { 'x-hub-signature-256': dataSignature } : {}),
                            'x-github-event': 'testevent',
                        })
                        .send(TEST_PAYLOAD)
                        .expect(500, { message: 'test error', status: 500 })
                        .expect('Content-Length', '37')
                        .expect('Content-Type', /json/)
                        .then((): void => {
                            expect(false).to.not.eq(1);
                        });
                });
            });
        });
    });
});
