import * as mediasoup from 'mediasoup';
import type Logger from '../lib/Log.ts';

import type { types as mediasoupTypes } from 'mediasoup';

export const initMediasoup = async (log: Logger) => {
    log.info(`Setting up SFU`);

    // creating worker
    const worker = await mediasoup.createWorker();

    const mediaCodecs: mediasoupTypes.RouterRtpCodecCapability[] = [
        {
            kind: 'audio',
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2,
        },
        {
            kind: 'video',
            mimeType: 'video/VP8',
            clockRate: 90000,
        },
        {
            kind: 'video',
            mimeType: 'video/H264',
            clockRate: 90000,
            parameters: {
                'packetization-mode': 1,
                'profile-level-id': '42e01f',
                'level-asymmetry-allowed': 1,
            },
        },
    ];

    // creating a router
    worker.observer.on('newrouter', (router) => {
        log.info('new mediasoup router created [id: ' + router.id);
    });

    const router = await worker.createRouter({ mediaCodecs });

    // creating webrtc server
    worker.observer.on('newwebrtcserver', (webRtcServer) => {
        log.info(
            'new mediasoup WebRTC server created [id: %s]' + webRtcServer.id
        );
    });

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

    router.observer.on('newtransport', (transport) => {
        log.info('new mediasoup transport created [id: %s]' + transport.id);
    });

    return { worker, router, webRtcServer };
};
