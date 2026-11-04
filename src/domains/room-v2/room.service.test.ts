// src/domains/room-v2/room.service.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoomService } from './room.service.ts';

const users = {
    Alice: 'Alice',
    Bob: 'Bob',
};

const routerStringTest = 'roomRouterGoesHere';

test('creating room creates expected object', () => {
    const roomService = createRoomService();

    roomService.createRoom('1', users.Alice);
    const room = roomService.getRoom('1');
    assert.equal(room?.roomId, '1');
    assert.equal(room?.router, routerStringTest);
    assert.equal(room?.users.has(users.Alice), true);
});

test('User can create room and is first member', () => {
    const roomService = createRoomService();

    // room and user don't exist
    assert.equal(roomService.getRoom('1'), null);
    assert.equal(roomService.getUser('1', users.Alice), null);

    // creating room
    assert.equal(roomService.createRoom('1', users.Alice), true);

    assert.notEqual(roomService.getRoom('1'), null);
    assert.notEqual(roomService.getUser('1', users.Alice), null);
});

test('Room with an id can only be created once', () => {
    const roomService = createRoomService();

    // room does not exist
    assert.equal(roomService.getRoom('1'), null);

    // creating room
    assert.equal(roomService.createRoom('1', users.Alice), true);
    assert.notEqual(roomService.getRoom('1'), null);

    // unable to create room
    assert.equal(roomService.createRoom('1', users.Bob), false);

    // Bob is not in the room, Alice still is
    assert.equal(roomService.getUser('1', users.Bob), null);
    assert.notEqual(roomService.getUser('1', users.Alice), null);
});

test('joining room that does not exist returns false', () => {
    const roomService = createRoomService();
    assert.equal(roomService.joinRoom('1', users.Bob), false);
});

test('same user can not join the same room if they are already in it', () => {
    const roomService = createRoomService();

    // Alice creates and joins room 1
    assert.equal(roomService.createRoom('1', users.Alice), true);

    // Alice tries to join same room again
    assert.equal(roomService.joinRoom('1', users.Alice), false);

    // Bob joins room
    assert.equal(roomService.joinRoom('1', users.Bob), true);

    // Bob can't re-join room
    assert.equal(roomService.joinRoom('1', users.Bob), false);
});

test('user can leave room after joining', () => {
    const roomService = createRoomService();

    // user creates room (and joins is), and Bob joins - 2 users in room
    assert.equal(roomService.createRoom('1', users.Alice), true);
    assert.equal(roomService.joinRoom('1', users.Bob), true);
    assert.equal(roomService.getRoom('1')?.users.size, 2);

    // Alice leaves room, 1 member left
    assert.equal(roomService.leaveRoom('1', users.Alice), true);
    assert.equal(roomService.getRoom('1')?.users.size, 1);

    // Bob leaves room, 0 member left
    assert.equal(roomService.leaveRoom('1', users.Bob), true);
    assert.equal(roomService.getRoom('1')?.users.size, 0);
});

test('room can only be deleted when it exists and all users left', () => {
    const roomService = createRoomService();

    // room can't be deleted if it wasn't made
    assert.equal(roomService.deleteRoom('1'), false);

    // alice creates room, and is only member
    assert.equal(roomService.createRoom('1', users.Alice), true);
    assert.equal(roomService.getRoom('1')?.users.size, 1);

    // deleting room should fail
    assert.equal(roomService.deleteRoom('1'), false);

    // alice leaves room, room can be deleted, and will be null
    roomService.leaveRoom('1', users.Alice);
    assert.equal(roomService.getRoom('1')?.users.size, 0);
    assert.equal(roomService.deleteRoom('1'), true);
    assert.equal(roomService.getRoom('1'), null);
});
