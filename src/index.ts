/*
 * Package @manniwatch/docker
 * Source https://manniwatch.github.io/docker/
 */

import { ManniWatchApiProxyServer, ManniWatchProxyServer } from '@manniwatch/api-proxy-server';
import { join, resolve } from 'path';
import { Config } from './config';
import { ServerMode } from './mode';

const extractMode: () => ServerMode = (): ServerMode => {
    if (process.argv.length >= 3) {
        if (process.argv[2] === 'api') {
            // TODO: Default import
        } else if (process.argv[2] === 'full') {
            return ServerMode.FULL;
        } else {
            console.group(`Unknown Mode argument: "${process.argv[2]}"`);
            // eslint-disable-next-line no-console
            console.log('Using Default "api"');
            console.groupEnd();
        }
    }
    return ServerMode.API_ONLY;
};
const extractedMode: ServerMode = extractMode();
console.log(`Server runs in ${extractedMode === ServerMode.API_ONLY ? 'Api Only' : 'Full'} Mode`);
const server: ManniWatchApiProxyServer | ManniWatchProxyServer =
    extractedMode === ServerMode.API_ONLY
        ? new ManniWatchApiProxyServer(Config.endpoint, Config.port)
        : new ManniWatchProxyServer(Config.endpoint, Config.port, resolve(join('/manniwatch', 'client')));
server
    .start()
    .then((): void => {
        // eslint-disable-next-line no-console
        console.info(`Server started on ${Config.port} with endpoint ${Config.endpoint}`);
    })
    .catch(console.error);
process.on('SIGINT', (): void => {
    // eslint-disable-next-line no-console
    console.info('Interrupted');
    server
        .stop()
        .then((): void => {
            console.log('Server closed');
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .catch((err: any): void => {
            console.error('Error occured while stoping', err);
        })
        .finally((): void => {
            process.exit(0);
        });
});
