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

        socket.on('peerLeft',id=>{
            // console.log(`Peer ${id} has left the video call`);
            // socket.to(roomId).broadcast.emit('removeUserVideo',id)      
            // socket.disconnect()      
            userGone()   
        })
        
        socket.on('disconnect',()=>{ //there might be a better way
            // console.log('Socekt on disconnect activated!');
            // console.log(`${userId} has exited the browser`);
            // socket.to(roomId).broadcast.emit('removeUserVideo', userId)
            // socket.disconnect()   
            userGone()   
        })

        const userGone = () =>{
            console.log('Socekt on disconnect activated!');
            console.log(`${userId} has exited the browser`);
            socket.to(roomId).broadcast.emit('removeUserVideo', userId)
            socket.disconnect()
        }
    })
    
    
    
})
server.listen((process.env.PORT || port),()=>{
    console.log(`Server started at http://localhost:${port}`);
})