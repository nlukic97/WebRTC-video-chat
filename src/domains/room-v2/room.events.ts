import type { Server, Socket } from 'socket.io';
import type { types as mediasoupTypes } from 'mediasoup';

// Events browser sends to the server
export interface ClientToServerEvents {
    joinRoom: (roomId: string) => void;
    leaveRoom: (socketId: string) => void;
}

// Events server sends to the browser
export interface ServerToClientEvents {
    userConnected: (socketId: string) => void;
    rtpCapabilities: (rtpCapabilities: mediasoupTypes.RtpCapabilities) => void;
    removeUserVideo: (socketId: string) => void;
    forceDisconnect: () => void;
}

// Shortcuts so other files don't repeat the generics
export type RoomServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type RoomSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
