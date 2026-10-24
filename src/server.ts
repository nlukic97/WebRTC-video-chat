import Logger from './lib/Log.ts';
import express from 'express';
import { Socket } from 'socket.io';
import { readFileSync } from 'fs';
import { createHttpServer } from './infra/httpServer.ts';
import { createPeerServer } from './infra/peerServer.ts';
import { iceServers as iceServersList } from './config/iceServers.ts';
import { ENV, HOST, PEER_PORT, PORT, useHttps } from './config/env.ts';
import { createSocketServer } from './infra/socketServer.ts';
import { createRoomRouter } from './domains/room/room.routes.ts';
// import { getMemoryUsageMessage, getCpuUsageMessage } from "./lib/LogMemoryUsage.ts";

const __dirname = import.meta.dirname;

// logger
const Log = new Logger(ENV);

// getting certs
const ssl = useHttps
    ? {
          key: readFileSync(__dirname + '/../cert/selfsigned.key', 'utf8'),
          cert: readFileSync(__dirname + '/../cert/selfsigned.crt', 'utf8'),
      }
    : undefined;

// init servers
const app = express();
const httpServer = createHttpServer(app, ssl);
const peerServer = createPeerServer(PEER_PORT, ssl);
const io = createSocketServer(httpServer);

// set up views
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));
app.set('views', __dirname + '/views');

// routes
app.use(createRoomRouter({ peerPort: PEER_PORT, iceServers: iceServersList }));

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
