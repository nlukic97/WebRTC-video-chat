import fs from "fs"
import express from 'express';

import dotenv from "dotenv"
dotenv.config();

import { v4 as uuidv4 } from 'uuid';

import {createServer as createServerHttp} from "http";
import {createServer as createServerHttps} from "https";

import { Server } from "socket.io";
import { PeerServer } from 'peer';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

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


const io = new Server(httpServer);

// @todo this peerServer is necessary. But the socket server might not be
const peerServer = PeerServer({
    port:9000,
    path:'/peerjs',
    ssl: useHttps && {key,cert}
})


app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/views'))
app.set('views', __dirname + '/views');

// const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Routes */

// @notice Creates a new room for video calling
app.get('/',(_, res)=>res.redirect(`/${uuidv4()}`))

// Opens a room with a specific id that has already been created
// @notice Opens a room with a specific id.
app.get('/:room',(req,res)=> {
    return res.render('room/index', { roomId: req.params.room, peerPort: PEER_PORT })
})

// 404 handler for all other routes
app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

// @notice socket event listeners and actions
io.on('connection',socket=>{
    console.log(socket.id)
    console.log(`User has connected.`);
    
    socket.on('join-room',async (roomId, userId)=>{
        console.log(`user ${userId} has entered.`);
        socket.join(roomId)

        socket.to(roomId).emit('user-connected', userId);

        socket.on('peerLeft', id => {
            userGone();
        });

        const userGone = () =>{
            console.log('Socekt on disconnect activated!');
            console.log(`${userId} has exited with the btn from peer. Sending him info to disconnect`);
            socket.emit('forceDisconnect') //disconnecting from client side. 'On disconnect will be triggered after there, telling all to remove the disconnected person.'
        }

        //disconnecting people who exited the server by exiting the browser. 
        //Telling others to remove the video of the disconnected person. videoid is the same as the peerId
        socket.on('disconnect',()=>{
            console.log(`User with the id ${userId} has exited via browser`);
            socket.to(roomId).emit('removeUserVideo', userId)
        })
    })
})

peerServer.listen(()=> console.log(`Peer server live at ${useHttps ? 'https' : 'http'}://localhost:9000`))
httpServer.listen(PORT,()=>console.log(`Listening at ${useHttps ? 'https' : 'http'}://localhost:${PORT}`))