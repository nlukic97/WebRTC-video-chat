let express = require('express')
let app = express()
let port = 443;
let server = require('http').createServer(app) //or createServer  ???
const io = require('socket.io')(server)
const {v4: uuidv4} = require('uuid')
const {ExpressPeerServer} = require('peer')
const peerServer = ExpressPeerServer(server,{
    debug: true
})
app.set('view engine', 'ejs') //what is the ejs module for ? ejs library?
app.use(express.static('./views'))

//peer 
app.use('/peerjs',peerServer) 

app.get('/',(req,res)=>{
    res.redirect(`/${uuidv4()}`)
})

app.get('/:room',(req,res)=>{
    res.render('room',{roomId: req.params.room}) //does this tell the server that we want the files in here to be shown ? read more on this
})

io.on('connection',socket=>{
    console.log(`User has connected.`);
    socket.on('join-room',(roomId, userId)=>{
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected',userId)

        socket.on('peerLeft',id=>{    
            userGone()   
        })

        const userGone = () =>{
            console.log('Socekt on disconnect activated!');
            console.log(`${userId} has exited the browser`);
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
server.listen((process.env.PORT || port),()=>{
    console.log(`Server started at http://localhost:${port}`);
})