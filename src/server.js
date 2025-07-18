import fs from "fs"
import express from 'express';

import dotenv from "dotenv"
dotenv.config();

import { v4 as uuidv4 } from 'uuid';

import {createServer as createServerHttp} from "http";
import {createServer as createServerHttps} from "https";

import { Server as SocketServer } from "socket.io";
import { PeerServer } from 'peer';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { useLog } from "./utils/Log.js";

// Configuring the console.log function. Only will log things if not set to production mode.
const Log = useLog(process.env.ENV)

const __dirname = dirname(fileURLToPath(import.meta.url));

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 443;
const PEER_PORT = process.env.PEER_PORT || 9000;

const app = express()
let key;
let cert;
let httpServer;

const useHttps = process.env.USE_HTTPS === 'true' ? true : process.env.USE_HTTPS === 'false' ? false : undefined;
if(useHttps === undefined) throw new Error('Please set useHttps to either "true" or "false"');

if(useHttps){
    // 1. https server
    key = fs.readFileSync(__dirname+ '/../cert/selfsigned.key','utf8');
    cert = fs.readFileSync(__dirname+'/../cert/selfsigned.crt','utf8');
    httpServer = createServerHttps({key: key, cert: cert },app);
} else {
    // 2. http server
    httpServer = createServerHttp(app);
}


const io = new SocketServer(httpServer);

// @todo this peerServer is necessary. But the socket server might not be
const peerServer = PeerServer({
    port:9000,
    path:'/peerjs',
    ssl: useHttps && {key,cert}
})


app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/views'))
app.set('views', __dirname + '/views');


/** Routes */
app.get('/',(_, res)=>res.redirect(`/${uuidv4()}`))
app.get('/:room',(req,res)=> res.render('room/index', { roomId: req.params.room, peerPort: PEER_PORT }))
app.use((_, res) => res.status(404).send('404 Not Found'));


/**
 * handleJoinRoon
 * 
 * Handles a user's request to join a room.
 * 
 * @param {string} roomId - The ID of the room the user wants to join.
 * @param {string} userId - The ID of the user joining the room.
 * @param {Socket} socket - The socket instance representing the user's connection.
 * 
 * Behavior:
 * - Logs the user's request to join the room.
 * - Adds the user's socket to the specified room.
 * - Notifies other users in the room that a new user has connected by emitting 'user-connected' with the userId.
 * - Sets up a listener for the 'disconnect' event on the socket, which will call handleDisconnect when triggered.
 */
const handleJoinRoon = async (roomId, userId, socket) => {
    Log(`user ${userId} has requested to enter room ${roomId}.`);
    await socket.join(roomId);

    socket.to(roomId).emit('user-connected', userId);
    socket.on('disconnect', () => handleDisconnect(roomId, userId, socket));
};

/**
 * handleManualDisconnect
 * 
 * Handles a manual disconnect request from a user (e.g., when a user clicks a "leave" button).
 * 
 * @param {Socket} socket - The socket instance representing the user's connection.
 * 
 * Behavior:
 * - Logs that the user (by socket id) has exited via the manual disconnect button.
 * - Emits a 'forceDisconnect' event to the client, instructing it to disconnect.
 * - The client-side disconnect will trigger the 'disconnect' event, which will notify other users to remove the disconnected user.
 */
const handleManualDisconnect = (socket) => {
    Log(`${socket.id} has exited with the btn from peer. Sending him info to disconnect`);
    socket.emit('forceDisconnect') //disconnecting from client side. 'On disconnect will be triggered after there, telling all to remove the disconnected person.'
}

/**
 * handleDisconnect
 * 
 * Handles the disconnection of a user from a room.
 * 
 * @param {string} roomId - The ID of the room the user is leaving.
 * @param {string} userId - The ID of the user who is disconnecting.
 * @param {Socket} socket - The socket instance representing the user's connection.
 * 
 * Behavior:
 * - Logs that the user has exited via the browser.
 * - Notifies other users in the room to remove the disconnected user's video by emitting 'removeUserVideo' with the userId.
 */
const handleDisconnect = (roomId, userId, socket) => {
    Log(`User with the id ${userId} has exited via browser`);
    socket.to(roomId).emit('removeUserVideo', userId);
};

/**
 * io.on('connection')
 * 
 * Sets up socket event listeners for each new client connection.
 * - Logs when a user connects.
 * - Handles 'join-room' event to join a room.
 * - Handles 'peerLeft' event for manual disconnects.
 */
io.on('connection',(socket)=>{
    Log(`User ${socket.id} has connected.`);
    
    // @todo perhaps it isn't necessary to add an additional join-room event. Maybe this can be done at the point of connecting to the ws server
    socket.on('join-room', (roomId, userId) => handleJoinRoon(roomId, userId, socket));
    socket.on('peerLeft', () => handleManualDisconnect(socket));
})


peerServer.listen(()=> Log(`Peer server live at ${useHttps ? 'https' : 'http'}://${HOST}:9000`))
httpServer.listen(PORT,()=>Log(`Listening at ${useHttps ? 'https' : 'http'}://${HOST}:${PORT}`))