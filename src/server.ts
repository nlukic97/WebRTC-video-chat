import Logger from './lib/Log.ts';
import express from 'express';
import { readFileSync } from 'fs';
import { createHttpServer } from './infra/http.server.ts';
import { createPeerServer } from './infra/peer.server.ts';
import { iceServers as iceServersList } from './config/iceServers.ts';
import {
    ENV,
    HOST,
    MEDIASOUP_ANNOUNCED_ADDRESS,
    PEER_PORT,
    PORT,
    useHttps,
} from './config/env.ts';
import { createSocketServer } from './infra/socket.server.ts';
import { createRoomRouter } from './domains/room/room.routes.ts';
import { createRoomRouter as createRoomRouterV2 } from './domains/room-v2/room.routes.ts';
import { registerRoomSocket } from './domains/room/room.socket.ts';
import { registerRoomSocket as registerRoomSocketV2 } from './domains/room-v2/room.socket.ts';
import { initMediasoup } from './infra/mediasoup.server.ts';
import { createRoomService } from './domains/room/room.service.ts';
import { createRoomService as createRoomServiceV2 } from './domains/room-v2/room.service.ts';
// import { getMemoryUsageMessage, getCpuUsageMessage } from "./lib/LogMemoryUsage.ts";
import { mediaCodecs } from './config/mediasoup.ts';

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

// mediasoup
let worker;
let webRtcServer;
try {
    ({ worker, webRtcServer } = await initMediasoup(
        Log,
        MEDIASOUP_ANNOUNCED_ADDRESS
    ));
} catch (err) {
    Log.error('Error setting up mediasoup');
    console.error(err);
    process.exit(1);
}

// set up views
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));
app.set('views', __dirname + '/views');

/** room setup
 * - service
 * - router handlers
 * - socket handlers
 */
// room v1 - uses the Peerjs - p2p webrtc
const roomService = createRoomService();
const roomRouter = createRoomRouter({
    roomService,
    peerPort: PEER_PORT,
    iceServers: iceServersList,
});
app.use(roomRouter);
registerRoomSocket(io, { log: Log });

// room v2 - WIP - will use mediasoup
const roomServiceV2 = createRoomServiceV2({
    worker,
    webRtcServer,
    mediaCodecs,
});
const roomRouterV2 = createRoomRouterV2({
    roomService: roomServiceV2,
});
app.use(roomRouterV2);
registerRoomSocketV2(io.of('/v2'), { log: Log, roomService: roomServiceV2 });

// 404 route
app.use((_, res) => res.status(404).send('404 Not Found'));

peerServer.listen(() =>
    Log.info(
        `Peer server live at ${useHttps ? 'https' : 'http'}://${HOST}:9000`
    )
);

httpServer.listen(PORT, () =>
    Log.info(`Listening at ${useHttps ? 'https' : 'http'}://${HOST}:${PORT}`)
);

const shutdown = (signal: string) => {
    Log.info(`${signal} received, shutting down`);
    process.exit(0);
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT')); // Ctrl+C
