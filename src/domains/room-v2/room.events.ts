import type { Server, Socket } from 'socket.io';
import type { types as mediasoupTypes } from 'mediasoup';
import type { TransportOptions } from 'mediasoup-client/types';
import type {
    AppData,
    DtlsParameters,
    MediaKind,
    RtpParameters,
} from 'mediasoup/types';
import type { CallbackFunction } from 'node:ffi';

// Events browser sends to the server
export interface ClientToServerEvents {
    joinRoom: (
        roomId: string,
        callback: (rtpCapabilities: mediasoupTypes.RtpCapabilities) => void
    ) => void;
    createWebRtcTransports: (
        roomId: string,
        callback: (transports: {
            sendTransportData: TransportOptions;
            receiveTransportData: TransportOptions;
        }) => void
    ) => void;
    transportConnect: (
        {
            roomId,
            transportId,
            dtlsParameters,
        }: {
            roomId: string;
            transportId: string;
            dtlsParameters: DtlsParameters;
        },
        callback: CallbackFunction
    ) => void;
    makeProducer: (
        {
            roomId,
            parameters,
        }: {
            roomId: string;
            parameters: {
                kind: MediaKind;
                rtpParameters: RtpParameters;
                appData: AppData;
            };
        },
        callback: CallbackFunction
    ) => void;
}

// Events server sends to the browser
export interface ServerToClientEvents {
    userConnected: (socketId: string) => void;
    removeUserVideo: (socketId: string) => void;
}

// Shortcuts so other files don't repeat the generics
export type RoomServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type RoomSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
