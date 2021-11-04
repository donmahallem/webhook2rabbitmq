/*
 * Package @manniwatch/api-proxy-router
 * Source https://manniwatch.github.io/docs/api-proxy-router/index.html
 */

import { sign } from '@octokit/webhooks-methods';
import { expect } from 'chai';
import express from 'express';
import 'mocha';
import Sinon from 'sinon';
import supertest from 'supertest';
import { AmqHandler } from './amq-handler';
import { createServer } from './server';
/* eslint-disable @typescript-eslint/no-explicit-any */
describe('endpoints/stop-point.ts', (): void => {
    describe('createStopPointRouter', (): void => {
        let app: express.Application;
        const TEST_SECRETS: (string | undefined)[] = ['super_secret', undefined];
        let sandbox: Sinon.SinonSandbox;
        before((): void => {
            sandbox = Sinon.createSandbox();
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
                    app = createServer(handlerStub, testSecret);
                    dataSignature = testSecret ? await sign({ algorithm: 'sha256', secret: testSecret }, TEST_PAYLOAD) : undefined;
                });
                it(`should pass`, async (): Promise<void> => {
                    handlerStub.send.resolves();
                    return supertest(app)
                        .post('/api/webhooks/github')
                        .set({
                            ...(dataSignature ? { 'x-hub-signature-256': dataSignature } : {}),
                            'x-github-event': 'testevent',
                            'content-type': 'application/json',
                        })
                        .send(TEST_PAYLOAD)
                        .expect(200, { status: 200 })
                        .expect('Content-Length', '14')
                        .expect('Content-Type', /json/)
                        .then((): void => {
                            expect(false).to.not.eq(1);
                        });
                });
                it(`should not pass`, async (): Promise<void> => {
                    const TEST_ERROR: Error = new Error('test error');
                    handlerStub.send.rejects(TEST_ERROR);
                    return supertest(app)
                        .post('/api/webhooks/github')
                        .set({
                            ...(dataSignature ? { 'x-hub-signature-256': dataSignature } : {}),
                            'x-github-event': 'testevent',
                            'content-type': 'application/json',
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
