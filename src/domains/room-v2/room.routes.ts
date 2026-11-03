import { Router } from 'express';
import type { IRoomService } from './room.service.ts';

type RoomRoutesDeps = {
    roomService: IRoomService;
};

export const createRoomRouter = ({ roomService }: RoomRoutesDeps): Router => {
    const router = Router();

    router.get('/room-v2', (_, res) => {
        const roomId = roomService.generateRandomRoomId();
        return res.redirect(`/room-v2/${roomId}`);
    });

    // a new visitor gets a fresh room
    router.get('/room-v2/:room', (req, res) => {
        return res.render('room/index-v2', {
            roomId: req.params.room,
        });
    });

    return router;
};
