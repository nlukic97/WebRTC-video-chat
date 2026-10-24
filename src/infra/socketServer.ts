import type { Server } from 'node:http';
import { Server as SocketServer } from 'socket.io';

export const createSocketServer = (httpServer: Server): SocketServer => {
    return new SocketServer(httpServer);
};
