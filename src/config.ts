/*
 * Package @manniwatch/docker
 * Source https://manniwatch.github.io/docker/
 */

export class Config {
    /**
     * gets the port for the server
     *
     * @returns {number} Port to be used
     */
    public static get port(): number {
        if (process.env.MW_PORT) {
            return parseInt(process.env.MW_PORT, 10);
        }
        throw new Error('No port specified');
    }

    /**
     * Retrieves the endpoint environment variable
     *
     * @returns {string} Endpoint to query data from
     */
    public static get endpoint(): string {
        if (process.env.MW_ENDPOINT) {
            return process.env.MW_ENDPOINT;
        }
        throw new Error('No endpoint specified');
    }
}
