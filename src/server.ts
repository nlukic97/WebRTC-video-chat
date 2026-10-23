import fs from 'fs';
import express from 'express';

import dotenv from 'dotenv';
dotenv.config();

import { v4 as uuidv4 } from 'uuid';

import { createServer as createServerHttp, Server } from 'http';
import { createServer as createServerHttps } from 'https';

import { Socket, Server as SocketServer } from 'socket.io';
import { PeerServer } from 'peer';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

import Logger from './utils/Log.ts';

import { iceServers as iceServersList } from './utils/iceServers.ts';
// import { getMemoryUsageMessage, getCpuUsageMessage } from "./utils/LogMemoryUsage.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 443;
const PEER_PORT: number = Number(process.env.PEER_PORT) || 9000;

const app = express();
let key: string | undefined;
let cert: string | undefined;
let httpServer: Server;

const useHttps =
    process.env.USE_HTTPS === 'true'
        ? true
        : process.env.USE_HTTPS === 'false'
          ? false
          : undefined;
if (useHttps === undefined)
    throw new Error('Please set useHttps to either "true" or "false"');

if (useHttps) {
    // 1. https server
    key = fs.readFileSync(__dirname + '/../cert/selfsigned.key', 'utf8');
    cert = fs.readFileSync(__dirname + '/../cert/selfsigned.crt', 'utf8');
    httpServer = createServerHttps({ key, cert }, app);
} else {
    // 2. http server
    httpServer = createServerHttp(app);
}

// PeerServer
const peerServer = PeerServer({
    port: PEER_PORT,
    path: '/peerjs',
    ssl: useHttps && key && cert ? { key, cert } : undefined,
});

if (!process.env.ENV) {
    throw new Error('Please set ENV');
}
const Log = new Logger(process.env.ENV);

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));
app.set('views', __dirname + '/views');

/** Routes */
app.get('/', (_, res) => res.redirect(`/${uuidv4()}`));

app.get('/:room', (req, res) =>
    res.render('room/index', {
        roomId: req.params.room,
        peerPort: PEER_PORT,
        iceServers: JSON.stringify(iceServersList),
    })
);

app.use((_, res) => res.status(404).send('404 Not Found'));

const handleJoinRoon = async (
    roomId: string,
    peerId: string,
    socket: Socket
) => {
    Log.info(`Peer with id ${peerId} has requested to enter room ${roomId}.`);
    await socket.join(roomId);

    socket.to(roomId).emit('userConnected', peerId);
    socket.on('disconnect', () => handleDisconnect(roomId, peerId, socket));
};

const handleManualDisconnect = (socket: Socket) => {
    Log.info(
        `${socket.id} has exited with the btn from peer. Sending him info to disconnect`
    );
    socket.emit('forceDisconnect'); //disconnecting from client side. 'On disconnect will be triggered after there, telling all to remove the disconnected person.'
};

const handleDisconnect = (roomId: string, peerId: string, socket: Socket) => {
    Log.info(`User with peer id ${peerId} has exited via browser`);
    socket.to(roomId).emit('removeUserVideo', peerId);
};

const io = new SocketServer(httpServer);

io.on('connection', (socket: Socket) => {
    Log.info(`User with socket.id ${socket.id} has connected.`);

    socket.on('joinRoom', (roomId: string, userId: string) =>
        handleJoinRoon(roomId, userId, socket)
    );
    socket.on('peerLeft', () => handleManualDisconnect(socket));
});

peerServer.listen(() =>
    Log.info(
        `Peer server live at ${useHttps ? 'https' : 'http'}://${HOST}:9000`
    )
);

httpServer.listen(PORT, () =>
    Log.info(`Listening at ${useHttps ? 'https' : 'http'}://${HOST}:${PORT}`)
);
