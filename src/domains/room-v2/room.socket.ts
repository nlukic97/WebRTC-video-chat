import type { Namespace } from 'socket.io';
import type Logger from '../../lib/Log.ts';
import type {
    ClientToServerEvents,
    RoomSocket,
    ServerToClientEvents,
} from './room.events.ts';
import type { IRoomService } from './room.service.ts';

type RoomSocketDeps = {
    log: Logger;
    roomService: IRoomService;
};

export const registerRoomSocket = (
    io: Namespace<ClientToServerEvents, ServerToClientEvents>,
    { log, roomService }: RoomSocketDeps
) => {
    const handleJoinRoom = async (roomId: string, socket: RoomSocket) => {
        log.info(`Socket ${socket.id} has entering room ${roomId}.`);

        try {
            // create room, or join existing room
            const created = await roomService.createRoom(roomId, socket.id);
            if (!created) {
                const joined = await roomService.joinRoom(roomId, socket.id);

                if (!joined) {
                    throw Error('User was not able to join the room');
                }
            }

            await socket.join(roomId);

            socket.to(roomId).emit('userConnected', socket.id);

            socket.on('disconnect', () => handleDisconnect(roomId, socket));

            // @audit-info line
            const room = await roomService.getRoom(roomId);
            if (room) {
                log.info(`Room ${roomId} size: ${room.users.size}`);
            }
        } catch (err) {
            console.error(err);
            // @audit-issue what happens if there is an error, do we sent back the user info about it?
            /* socket.emit('errorJoiningRoom', {
                error: 'Unable to create or join room',
            }); */
        }
    };

    const handleDisconnect = async (roomId: string, socket: RoomSocket) => {
        log.info(`Socket ${socket.id} has disconnected from room ${roomId}`);

        try {
            const left = await roomService.leaveRoom(roomId, socket.id);
            if (!left) {
                throw Error('Unable to leave room');
            }

            // try to delete - won't happen if 1 user is left
            const deleted = await roomService.deleteRoom(roomId);

            // @todo debug lines
            if (deleted) {
                log.info(`Room ${roomId} has been deleted`);
            } else {
                log.info(`Room ${roomId} has NOT been deleted`);
            }

            socket.to(roomId).emit('removeUserVideo', socket.id); // @todo should this be here?
        } catch (err) {
            console.error(err);
            // @todo what happens if there is an error
            /* socket.emit('errorJoiningRoom', {
                error: 'Unable to create or join room',
            }); */
        }
    };

    io.on('connection', (socket: RoomSocket) => {
        log.info(
            `Socket ${socket.id} has connected, but has not requested to join any rooms.`
        );

        socket.on('joinRoom', (roomId) => handleJoinRoom(roomId, socket));
        socket.on('leaveRoom', () => socket.emit('forceDisconnect'));
    });
};
