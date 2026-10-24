import { PeerServer } from 'peer';
import type { SslType } from './httpServer.ts';

export const createPeerServer = (port: number, ssl: SslType) => {
    return PeerServer({
        port: port,
        path: '/peerjs',
        ssl,
    });
};
