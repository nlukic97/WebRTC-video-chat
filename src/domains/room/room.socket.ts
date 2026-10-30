import type Logger from '../../lib/Log.ts';
import type { RoomServer, RoomSocket } from './room.events.ts';

type RoomSocketDeps = {
    log: Logger;
};

export const registerRoomSocket = (io: RoomServer, { log }: RoomSocketDeps) => {
    const handleJoinRoom = async (
        roomId: string,
        peerId: string,
        socket: RoomSocket
    ) => {
        log.info(
            `Peer with id ${peerId} has requested to enter room ${roomId}.`
        );
        await socket.join(roomId);

        socket.to(roomId).emit('userConnected', peerId);
        socket.on('disconnect', () => handleDisconnect(roomId, peerId, socket));
    };

    const handleManualDisconnect = (socket: RoomSocket) => {
        log.info(
            `${socket.id} has exited with the btn from peer. Sending him info to disconnect`
        );
        socket.emit('forceDisconnect');
    };

    const handleDisconnect = (
        roomId: string,
        peerId: string,
        socket: RoomSocket
    ) => {
        log.info(`User with peer id ${peerId} has exited via browser`);
        socket.to(roomId).emit('removeUserVideo', peerId);
    };

    io.on('connection', (socket: RoomSocket) => {
        log.info(`User with socket.id ${socket.id} has connected.`);

        socket.on('joinRoom', (roomId, peerId) =>
            handleJoinRoom(roomId, peerId, socket)
        );
        socket.on('peerLeft', () => handleManualDisconnect(socket));
    });
};
