import type { Server, Socket } from 'socket.io';

// Events browser sends to the server
export interface ClientToServerEvents {
    joinRoom: (roomId: string, peerId: string) => void;
    peerLeft: (peerId: string) => void;
}

// Events server sends to the browser
export interface ServerToClientEvents {
    userConnected: (peerId: string) => void;
    removeUserVideo: (peerId: string) => void;
    forceDisconnect: () => void;
}

// Shortcuts so other files don't repeat the generics
export type RoomServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type RoomSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
