import { v6 as uuidv6 } from 'uuid';

export interface IRoomService {
    generateRandomRoomId: () => string;
}

export const createRoomService = (): IRoomService => {
    const generateRandomRoomId = (): string => {
        return uuidv6();
    };

    return { generateRandomRoomId };
};

//@todo change return type to uuidv6 if possible
