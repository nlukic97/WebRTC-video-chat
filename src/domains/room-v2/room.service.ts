import { v6 as uuidv6 } from 'uuid';

export interface IRoomService {
    generateRandomRoomId: () => string;
}

export const createRoomService = (): IRoomService => {
    //@todo change return type to uuidv6 if possible via branded types
    const generateRandomRoomId = (): string => {
        return uuidv6();
    };

    return { generateRandomRoomId };
};
