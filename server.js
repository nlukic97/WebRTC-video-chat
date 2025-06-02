import fs from "fs"
import express from 'express';
import dotenv from "dotenv"
dotenv.config();

import { v4 as uuidv4 } from 'uuid';
import { ExpressPeerServer } from 'peer';
import {createServer} from "https";
import { Server } from "socket.io";

// certificates
const key = fs.readFileSync('./cert/key.pem');
const cert = fs.readFileSync('./cert/cert.pem');

const app = express()
const httpServer = createServer({key: key, cert: cert },app);
const io = new Server(httpServer);

const peerServer = ExpressPeerServer(httpServer, {
    debug: true,
    key: key
})


app.set('view engine', 'ejs')
app.use(express.static('./views'))
const PORT = process.env.PORT || 443;

//peer
app.use('/peerjs',peerServer) 

/** Routes */

// @notice Creates a new room for video calling
app.get('/',(_, res)=>res.redirect(`/${uuidv4()}`))

// Opens a room with a specific id that has already been created
// @notice Opens a room with a specific id.
app.get('/:room',(req,res)=>res.render('room', { roomId: req.params.room, peerPort: PORT }))

// @notice socket event listeners and actions
io.on('connection',socket=>{
    console.log(`User has connected.`);
    socket.on('join-room',(roomId, userId)=>{
        console.log(`user ${userId} has entered.`);
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected',userId)

        socket.on('peerLeft',id=>{    
            userGone()   
        })

        const userGone = () =>{
            console.log('Socekt on disconnect activated!');
            console.log(`${userId} has exited with the btn from peer. Sending him info to disconnect`);
            socket.emit('forceDisconnect') //disconnecting from client side. 'On disconnect will be triggered after there, telling all to remove the disconnected person.'
        }

        //disconnecting people who exited the server by exiting the browser. 
        //Telling others to remove the video of the disconnected person. videoid is the same as the peerId
        socket.on('disconnect',()=>{
            console.log(`User with the id ${userId} has exited via browser`);
            socket.to(roomId).broadcast.emit('removeUserVideo', userId)
        })
    })
})

httpServer.listen(PORT,()=>console.log(`Listening at https://localhost:${PORT}`))