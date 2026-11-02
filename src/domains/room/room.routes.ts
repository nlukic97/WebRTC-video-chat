import { Router } from 'express';
import { createRoomId } from './room.service.ts';

type RoomRoutesDeps = {
    peerPort: number;
    iceServers: { urls: string }[];
};

export const createRoomRouter = ({
    peerPort,
    iceServers,
}: RoomRoutesDeps): Router => {
    const router = Router();

    // a new visitor gets a fresh room
    router.get('/', (_, res) => {
        const roomId = createRoomId();
        return res.redirect(`/${roomId}`);
    });

    // Users join the :room room id
    router.get('/:room', (req, res) => {
        return res.render('room/index', {
            roomId: req.params.room,
            peerPort,
            iceServers: JSON.stringify(iceServers),
        });
    });

    return router;
};
