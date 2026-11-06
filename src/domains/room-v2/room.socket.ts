import type { Namespace, Socket } from 'socket.io';
import type Logger from '../../lib/Log.ts';
import type {
    ClientToServerEvents,
    RoomSocket,
    ServerToClientEvents,
} from './room.events.ts';
import type { IRoomService } from './room.service.ts';
import type {
    AppData,
    DtlsParameters,
    MediaKind,
    RtpParameters,
} from 'mediasoup/types';

type RoomSocketDeps = {
    log: Logger;
    roomService: IRoomService;
};

export const registerRoomSocket = (
    io: Namespace<ClientToServerEvents, ServerToClientEvents>,
    { log, roomService }: RoomSocketDeps
) => {
    const handleJoinRoom = async (
        roomId: string,
        socket: Socket<ClientToServerEvents, ServerToClientEvents>
    ) => {
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
            if (!room) {
                throw Error('Room not found');
            }

            socket.emit('rtpCapabilities', room.router.rtpCapabilities);

            // log.info(`Room ${roomId} size: ${room.users.size}`);
        } catch (err) {
            console.error(err);
            // @audit-issue what happens if there is an error, do we sent back the user info about it?
            /* socket.emit('errorJoiningRoom', {
                error: 'Unable to create or join room',
            }); */
        }
    };

    const handleCreateWebRtcTransports = async (
        roomId: string,
        socket: Socket<ClientToServerEvents, ServerToClientEvents>
    ) => {
        log.info(
            `Socket ${socket.id} requesting WebRtcTransport creation for room ${roomId}.`
        );

        try {
            const transports = await roomService.createWebRtcTransports(
                roomId,
                socket.id
            );
            if (!transports) {
                throw Error('transport not found');
            }

            const sendTransport = transports.sendTransport;
            const receiveTransport = transports.receiveTransport;
            if (!sendTransport || !receiveTransport) {
                throw new Error(
                    'Either send or receive transports are not found to sent to client'
                );
            }

            const sendTranportData = {
                id: sendTransport.id,
                iceParameters: sendTransport.iceParameters,
                iceCandidates: sendTransport.iceCandidates,
                dtlsParameters: sendTransport.dtlsParameters,
            };

            const receiveTranportData = {
                id: receiveTransport.id,
                iceParameters: receiveTransport.iceParameters,
                iceCandidates: receiveTransport.iceCandidates,
                dtlsParameters: receiveTransport.dtlsParameters,
            };

            socket.emit('webRtcTransportsCreated', {
                sendTransportData: sendTranportData,
                receiveTransportData: receiveTranportData,
            });

            log.info(`Room ${roomId} has webRtcTransport created`);
        } catch (err) {
            console.error(err);
            // @audit-issue what happens if there is an error
            /* socket.emit('errorJoiningRoom', {
                error: 'Unable to create webRtcTransport',
            }); */
        }
    };

    const handleTransportConnect = async (
        socket: RoomSocket,
        data: {
            roomId: string;
            transportId: string;
            dtlsParameters: DtlsParameters;
        },
        callback: CallableFunction
    ): Promise<boolean> => {
        // @audit-issue move this to service method and fix this method up a bit
        const room = await roomService.getRoom(data.roomId);
        if (!room) {
            return false;
        }

        await room.users.get(socket.id)?.transports.sendTransport?.connect({
            dtlsParameters: { ...data.dtlsParameters },
        });

        callback();

        return true;
    };

    const handleMakeProducer = async (
        socket: RoomSocket,
        data: {
            roomId: string;
            parameters: {
                kind: MediaKind;
                rtpParameters: RtpParameters;
                appData: AppData;
            };
        },
        callback: CallableFunction
    ): Promise<boolean> => {
        // @audit-issue move this to service method and fix this method up a bit
        const room = await roomService.getRoom(data.roomId);
        if (!room) {
            return false;
        }

        const user = room.users.get(socket.id);

        // @todo handle this differentyl
        if (!user) {
            return false;
        }

        // creating users producer
        // @todo use method for this
        const producer = await user?.transports.sendTransport?.produce({
            kind: data.parameters.kind,
            rtpParameters: data.parameters.rtpParameters,
        });

        // @todo handle error in cabblack properly
        if (!producer) {
            return false;
        }

        // storing producers in the user object
        if (producer?.kind === 'video') {
            user.producers.video = producer;
        } else if (producer?.kind === 'audio') {
            user.producers.audio = producer;
        }

        callback({ id: producer.id });

        return true;
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

            socket.to(roomId).emit('removeUserVideo', socket.id); // @todo should this be here? Also might need to handle cleanup on server and with usesr
        } catch (err) {
            console.error(err);
            // @todo what happens if there is an error
        }
    };

    io.on('connection', (socket: RoomSocket) => {
        log.info(
            `Socket ${socket.id} has connected, but has not requested to join any rooms.`
        );

        socket.on('joinRoom', (roomId) => handleJoinRoom(roomId, socket));

        socket.on('createWebRtcTransports', (roomId) =>
            handleCreateWebRtcTransports(roomId, socket)
        );

        socket.on('transportConnect', (data, callback) => {
            handleTransportConnect(socket, data, callback);
        });

        socket.on('makeProducer', (data, callback) => {
            handleMakeProducer(socket, data, callback);
        });

        socket.on('leaveRoom', () => socket.emit('forceDisconnect'));
    });
};
