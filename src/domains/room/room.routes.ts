import { Router } from 'express';
import type { IRoomService } from './room.service.ts';

type RoomRoutesDeps = {
    roomService: IRoomService;
    peerPort: number;
    iceServers: { urls: string }[];
};

export const createRoomRouter = ({
    roomService,
    peerPort,
    iceServers,
}: RoomRoutesDeps): Router => {
    const router = Router();

    // @todo - remove this later, temporarily added to make v2 path default on load
    router.get('/', (_, res) => res.redirect('/room-v2'));

    // a new visitor gets a fresh room
    router.get('/room', (_, res) => {
        const roomId = roomService.generateRandomRoomId();
        return res.redirect(`/room/${roomId}`);
    });

    // Users join the :room room id
    router.get('/room/:room', (req, res) => {
        return res.render('room/index', {
            roomId: req.params.room,
            peerPort,
            iceServers: JSON.stringify(iceServers),
        });
    });

    return router;
};
