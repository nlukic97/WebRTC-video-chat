import { PeerServer } from 'peer';
import type { SslType } from './http.server.ts';

export const createPeerServer = (port: number, ssl: SslType) => {
    return PeerServer({
        port: port,
        path: '/peerjs',
        ssl,
    });
};
