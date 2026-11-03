import * as mediasoup from 'mediasoup';
import type { types as mediasoupTypes } from 'mediasoup';

import type Logger from '../lib/Log.ts';

export const initMediasoup = async (
    log: Logger
): Promise<{
    worker: mediasoupTypes.Worker;
    webRtcServer: mediasoupTypes.WebRtcServer;
}> => {
    // creating worker
    const worker = await mediasoup.createWorker();

    // create webrtc server
    const webRtcServer = await worker.createWebRtcServer({
        listenInfos: [
            {
                protocol: 'udp',
                ip: '0.0.0.0',
                announcedAddress: '127.0.0.1', // @todo might need to remove later in prod
                port: 3001, // @todo env variable this
            },
            {
                protocol: 'tcp',
                ip: '0.0.0.0',
                announcedAddress: '127.0.0.1', // @todo might need to remove later in prod
                port: 3001, // @todo env variable this
            },
        ],
    });

    log.info('Mediasoup worker and webRtcServer created successfully.');
    return { worker, webRtcServer };
};
