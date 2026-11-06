import { v6 as uuidv6 } from 'uuid';
import type { types as mediasoupTypes } from 'mediasoup';
import type { Producer } from 'mediasoup/types';

type TransportsType = {
    sendTransport: mediasoupTypes.WebRtcTransport | undefined;
    receiveTransport: mediasoupTypes.WebRtcTransport | undefined;
};

type UserType = {
    userId: string;
    transports: TransportsType;
    producers: {
        video: Producer | undefined;
        audio: Producer | undefined;
    };
};

type RoomType = {
    roomId: string;
    router: mediasoupTypes.Router;
    users: Map<string, UserType>;
};

type RoomServiceArgs = {
    worker: mediasoupTypes.Worker;
    webRtcServer: mediasoupTypes.WebRtcServer;
    mediaCodecs: mediasoupTypes.RouterRtpCodecCapability[];
};

export interface IRoomService {
    generateRandomRoomId: () => string;
    createRoom: (roomId: string, userId: string) => Promise<boolean>;
    createWebRtcTransports: (
        roomId: string,
        userId: string
    ) => Promise<TransportsType | null>;
    getWebRtcTransports: (
        roomId: string,
        userId: string
    ) => Promise<TransportsType | null>;
    getRoom: (roomId: string) => Promise<RoomType | null>;
    getUser: (roomId: string, userId: string) => Promise<UserType | null>;
    deleteRoom: (roomId: string) => Promise<boolean>;
    joinRoom: (roomId: string, userId: string) => Promise<boolean>;
    leaveRoom: (roomId: string, userId: string) => Promise<boolean>;
}

const MAX_USERS_PER_ROOM = 8; // @todo potentially configurable as the game goes alog

export const createRoomService = ({
    worker,
    webRtcServer,
    mediaCodecs,
}: RoomServiceArgs): IRoomService => {
    /** Map that stores the rooms.
     * Key: roomId, Value: roomData, currently map of users)
     */
    const rooms = new Map<string, Promise<RoomType>>();

    const _createNewUserData = (userId: string): UserType => {
        return {
            userId: userId,
            transports: {
                sendTransport: undefined,
                receiveTransport: undefined,
            },
            producers: {
                video: undefined,
                audio: undefined,
            },
        };
    };

    const _createNewRoomData = async (roomId: string): Promise<RoomType> => {
        // @todo error handling
        const router = await worker.createRouter({ mediaCodecs });
        return {
            roomId: roomId,
            router: router,
            users: new Map(),
        };
    };

    const generateRandomRoomId = (): string => {
        return uuidv6();
    };

    // returns true if room was created, false if not (meaning it already exists)
    const createRoom = async (
        roomId: string,
        userId: string
    ): Promise<boolean> => {
        // if room exists, return false
        if (rooms.has(roomId)) {
            return false;
        }

        // create new room with empty users map
        const roomPromise = _createNewRoomData(roomId);
        rooms.set(roomId, roomPromise);

        // create and add new user entry inside room.users map
        const newUserData = _createNewUserData(userId);

        try {
            const room = await roomPromise;
            room.users.set(userId, newUserData);

            console.log(`Room size`, room.users.size);

            return true;
        } catch (err) {
            rooms.delete(roomId);
            throw err;
        }
    };

    const createWebRtcTransports = async (
        roomId: string,
        userId: string
    ): Promise<TransportsType | null> => {
        const room = await getRoom(roomId);
        if (!room) {
            return null;
        }

        const user = room.users.get(userId);
        if (!user) {
            return null;
        }

        const sendTransport = await room.router.createWebRtcTransport({
            webRtcServer,
            enableUdp: true,
            enableTcp: false,
        });

        const receiveTransport = await room.router.createWebRtcTransport({
            webRtcServer,
            enableUdp: true,
            enableTcp: false,
        });

        user.transports.sendTransport = sendTransport;
        user.transports.receiveTransport = receiveTransport;

        return { sendTransport, receiveTransport };
    };

    const getWebRtcTransports = async (
        roomId: string,
        userId: string
    ): Promise<TransportsType | null> => {
        const user = await getUser(roomId, userId);
        if (!user) {
            return null;
        }

        const transports = user.transports;

        return transports;
    };

    const getRoom = async (roomId: string): Promise<RoomType | null> => {
        return (await rooms.get(roomId)) ?? null;
    };

    const getUser = async (
        roomId: string,
        userId: string
    ): Promise<UserType | null> => {
        const room = await rooms.get(roomId);

        if (!room || !room.users.has(userId)) {
            return null;
        }

        return room.users.get(userId) ?? null;
    };

    const deleteRoom = async (roomId: string): Promise<boolean> => {
        const room = await rooms.get(roomId);

        if (!room || room.users.size >= 1) {
            return false;
        }
        room.router.close();

        rooms.delete(roomId);
        return true;
    };

    // returns true if user was added, false if not (meaning room does not exist)
    const joinRoom = async (
        roomId: string,
        userId: string
    ): Promise<boolean> => {
        const room = await rooms.get(roomId);

        if (!room || room.users.has(userId)) {
            return false;
        }

        // Not allowing more users than the
        if (room.users.size + 1 > MAX_USERS_PER_ROOM) {
            return false;
        }

        const newUserData = _createNewUserData(userId);

        room.users.set(userId, newUserData);

        console.log(`Room size`, room.users.size);
        return true;
    };

    // returns true if user was added, false if not (meaning room does not exist)
    const leaveRoom = async (
        roomId: string,
        userId: string
    ): Promise<boolean> => {
        const room = await rooms.get(roomId);

        // if user doesn't exist, false
        if (!room || !room.users.has(userId)) {
            return false;
        }

        room.users.delete(userId);
        return true;
    };

    return {
        generateRandomRoomId,
        createRoom,
        createWebRtcTransports,
        getWebRtcTransports,
        getRoom,
        getUser,
        deleteRoom,
        joinRoom,
        leaveRoom,
    };
};
