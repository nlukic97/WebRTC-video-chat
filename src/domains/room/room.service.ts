import { v6 as uuidv6 } from 'uuid';

//@todo change return type to uuidv6 if possible
export const createRoomId = (): string => {
    return uuidv6();
};
