import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

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
    router.get('/', (_, res) => res.redirect(`/${uuidv4()}`));

    router.get('/:room', (req, res) =>
        res.render('room/index', {
            roomId: req.params.room,
            peerPort,
            iceServers: JSON.stringify(iceServers),
        })
    );

    return router;
};
