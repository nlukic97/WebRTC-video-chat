import { v6 as uuidv6 } from 'uuid';

export interface IRoomService {
    createRoomId: () => string;
}

export const createRoomService = (): IRoomService => {
    const createRoomId = (): string => {
        return uuidv6();
    };

    return { createRoomId };
};

//@todo change return type to uuidv6 if possible
