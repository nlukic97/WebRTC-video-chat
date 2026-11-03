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

    // a new visitor gets a fresh room
    router.get('/', (_, res) => {
        const roomId = roomService.generateRandomRoomId();
        return res.redirect(`/${roomId}`);
    });

    // @todo temporary - until we replace old routes
    router.get('/sfu-test', (_, res) => {
        const roomId = roomService.generateRandomRoomId();
        return res.redirect(`/sfu-test/${roomId}`);
    });

    // @todo temporary - until we replace old routes
    // a new visitor gets a fresh room
    router.get('/sfu-test/:room', (req, res) => {
        return res.render('room/sfu-test', {
            roomId: req.params.room,
            peerPort,
            iceServers: JSON.stringify(iceServers),
        });
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
