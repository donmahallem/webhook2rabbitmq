const client=require('./dist');
const handler=new client.AmqHandler('test');
const server=new client.createServer(handler);

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
