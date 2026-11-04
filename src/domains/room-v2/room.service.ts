import { v6 as uuidv6 } from 'uuid';

type RoomType = {
    roomId: string;
    router: string;
    users: Map<string, UserType>;
};

type UserType = { userId: string; transports: string[] };

export interface IRoomService {
    generateRandomRoomId: () => string;
    createRoom: (roomId: string, userId: string) => boolean;
    getRoom: (roomId: string) => RoomType | null;
    getUser: (roomId: string, userId: string) => UserType | null;
    deleteRoom: (roomId: string) => boolean;
    joinRoom: (roomId: string, userId: string) => boolean;
    leaveRoom: (roomId: string, userId: string) => boolean;
}

export const createRoomService = (): IRoomService => {
    /** Map that stores the rooms.
     * Key: roomId, Value: roomData, currently map of users)
     * @todo will need to update this to contain everything needed
     */
    const rooms = new Map<string, RoomType>();

    const _createNewUserData = (userId: string): UserType => {
        return {
            userId: userId,
            transports: ['send', 'receive'], // @todo should be real transport array
        };
    };

    const _createNewRoomData = (roomId: string): RoomType => {
        return {
            roomId: roomId,
            router: 'roomRouterGoesHere', // @todo should be a real router
            users: new Map(),
        };
    };

    //@todo change return type to uuidv6 if possible via branded types
    const generateRandomRoomId = (): string => {
        return uuidv6();
    };

    // returns true if room was created, false if not (meaning it already exists)
    const createRoom = (roomId: string, userId: string): boolean => {
        // if room exists, return false
        if (rooms.has(roomId)) {
            return false;
        }

        // create new room with empty users map
        const room = _createNewRoomData(roomId);
        rooms.set(roomId, room);

        // create and add new user entry inside room.users map
        const newUserData = _createNewUserData(userId);
        room.users.set(userId, newUserData);

        return true;
    };

    const getRoom = (roomId: string): RoomType | null => {
        return rooms.get(roomId) ?? null;
    };

    const getUser = (roomId: string, userId: string): UserType | null => {
        const room = rooms.get(roomId);

        if (!room || !room.users.has(userId)) {
            return null;
        }

        return room.users.get(userId) ?? null;
    };

    // returns true if room was created, false if not (meaning it already exists)
    const deleteRoom = (roomId: string): boolean => {
        const room = rooms.get(roomId);

        if (!room || room.users.size >= 1) {
            return false;
        }

        rooms.delete(roomId);
        return true;
    };

    // returns true if user was added, false if not (meaning room does not exist)
    const joinRoom = (roomId: string, userId: string): boolean => {
        const room = rooms.get(roomId);

        if (!room || room.users.has(userId)) {
            return false;
        }

        const newUserData = _createNewUserData(userId);

        room.users.set(userId, newUserData);
        return true;
    };

    // returns true if user was added, false if not (meaning room does not exist)
    const leaveRoom = (roomId: string, userId: string) => {
        const room = rooms.get(roomId);

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
        getRoom,
        getUser,
        deleteRoom,
        joinRoom,
        leaveRoom,
    };
};
