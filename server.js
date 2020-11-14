let express = require('express')
let app = express()
let port = 3030;
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
    res.render('room',{roomId: req.params.room})
})

io.on('connection',socket=>{
    console.log(`User has connected.`);
    socket.on('join-room',(roomId, userId)=>{
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected',userId)

        var leftVideoChat;

        socket.on('peerLeft',id=>{
            console.log(`Peer ${id} has left the video call`);
            socket.to(roomId).broadcast.emit('removeUserVideo',id)
            leftVideoChat = true;
            
        })
        
        socket.on('disconnect',()=>{ //there might be a better way
            console.log(`${userId} has exited the browser`);
            if(!leftVideoChat){
                socket.emit('closeYourPeer') //i  might not need this at all
                socket.to(roomId).broadcast.emit('removeUserVideo', userId)
            }
        })
    })
    

    
})
server.listen((process.env.PORT || port),()=>{
    console.log(`Server started at http://localhost:${port}`);
})