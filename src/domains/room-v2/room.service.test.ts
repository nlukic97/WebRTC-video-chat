// src/domains/room-v2/room.service.test.ts
import { beforeEach, describe, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createRoomService, type IRoomService } from './room.service.ts';
import { mediaCodecs } from '../../config/mediasoup.ts';
import type { types as mediasoupTypes } from 'mediasoup';

const users = {
    ALICE: 'Alice',
    BOB: 'Bob',
};

describe('RoomService tests', () => {
    let roomService: IRoomService;

    const close = mock.fn();
    const fakeRouter = { close };

    const fakeWorker = { createRouter: async () => fakeRouter };

    beforeEach(() => {
        close.mock.resetCalls(); // must be here

        roomService = createRoomService({
            worker: fakeWorker as unknown as mediasoupTypes.Worker,
            // webRtcServer,
            mediaCodecs,
        });
    });

    test('creating room creates expected object', async () => {
        await roomService.createRoom('1', users.ALICE);
        const room = await roomService.getRoom('1');

        assert.equal(room?.roomId, '1');
        assert.equal(room?.router, fakeRouter);
        assert.equal(room?.users.has(users.ALICE), true);
    });

    test('User can create room and is first member', async () => {
        // room and user don't exist
        assert.equal(await roomService.getRoom('1'), null);
        assert.equal(await roomService.getUser('1', users.ALICE), null);

        // creating room
        assert.equal(await roomService.createRoom('1', users.ALICE), true);

        assert.notEqual(await roomService.getRoom('1'), null);
        assert.notEqual(await roomService.getUser('1', users.ALICE), null);
    });

    test('Room with an id can only be created once', async () => {
        // room does not exist
        assert.equal(await roomService.getRoom('1'), null);

        // creating room
        assert.equal(await roomService.createRoom('1', users.ALICE), true);
        assert.notEqual(await roomService.getRoom('1'), null);

        // unable to create room
        assert.equal(await roomService.createRoom('1', users.BOB), false);

        // Bob is not in the room, Alice still is
        assert.equal(await roomService.getUser('1', users.BOB), null);
        assert.notEqual(await roomService.getUser('1', users.ALICE), null);
    });

    test('joining room that does not exist returns false', async () => {
        assert.equal(await roomService.joinRoom('1', users.BOB), false);
    });

    test('same user can not join the same room if they are already in it', async () => {
        // Alice creates and joins room 1
        assert.equal(await roomService.createRoom('1', users.ALICE), true);

        // Alice tries to join same room again
        assert.equal(await roomService.joinRoom('1', users.ALICE), false);

        // Bob joins room
        assert.equal(await roomService.joinRoom('1', users.BOB), true);

        // Bob can't re-join room
        assert.equal(await roomService.joinRoom('1', users.BOB), false);
    });

    test('user can leave room after joining', async () => {
        // user creates room (and joins is), and Bob joins - 2 users in room
        assert.equal(await roomService.createRoom('1', users.ALICE), true);
        assert.equal(await roomService.joinRoom('1', users.BOB), true);
        const room = await roomService.getRoom('1');
        assert.equal(room?.users.size, 2);

        // Alice leaves room, 1 member left
        assert.equal(await roomService.leaveRoom('1', users.ALICE), true);

        assert.equal(room?.users.size, 1);

        // Bob leaves room, 0 member left
        assert.equal(await roomService.leaveRoom('1', users.BOB), true);
        assert.equal(room?.users.size, 0);
    });

    test('room can only be deleted when it exists and all users left', async () => {
        // room can't be deleted if it wasn't made
        assert.equal(await roomService.deleteRoom('1'), false);

        // alice creates room, and is only member
        assert.equal(await roomService.createRoom('1', users.ALICE), true);
        const room = await roomService.getRoom('1');
        assert.equal(room?.users.size, 1);

        // deleting room should fail
        assert.equal(await roomService.deleteRoom('1'), false);

        // alice leaves room, no users are left, but router not destroyed
        await roomService.leaveRoom('1', users.ALICE);
        assert.equal(room?.users.size, 0);
        assert.equal(close.mock.callCount(), 0); // router not closed yet

        // deleting room
        assert.equal(await roomService.deleteRoom('1'), true);
        assert.equal(close.mock.callCount(), 1); // router will be

        assert.equal(await roomService.getRoom('1'), null);
    });
});
