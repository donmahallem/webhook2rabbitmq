/*
 * Package @manniwatch/api-proxy-router
 * Source https://manniwatch.github.io/docs/api-proxy-router/index.html
 */

import { expect } from 'chai';
import 'mocha';
import { HttpError } from './http-error';
/* eslint-disable @typescript-eslint/no-explicit-any */
describe('http-error.ts', (): void => {
    const errorMessages: string[] = ['Test Message', 'Error'];
    const errorCodes: (number | undefined)[] = [123, 400, undefined];
    errorMessages.forEach((errorMessage: string): void => {
        errorCodes.forEach((errorCode: number | undefined): void => {
            it(`should create Error with message '${errorMessage}' and code '${errorCode}'`, async (): Promise<void> => {
                const error: HttpError = new HttpError(errorMessage, errorCode);
                expect(error.message).to.eq(errorMessage);
                expect(error.status).to.eq(errorCode ? errorCode : 500);
                expect(error.name).to.equal('HttpError');
                expect(error).to.be.instanceOf(Error);
            });
        });
    });
});
