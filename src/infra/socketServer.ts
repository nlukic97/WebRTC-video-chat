import type { Server } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import type { RoomServer } from '../domains/room/room.events.ts';

export const createSocketServer = (httpServer: Server): RoomServer => {
    return new SocketServer(httpServer);
};
