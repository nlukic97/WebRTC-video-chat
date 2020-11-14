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
            userGone()   
        })

        const userGone = () =>{
            console.log('Socekt on disconnect activated!');
            console.log(`${userId} has exited the browser`);
            // socket.to(roomId).broadcast.emit('removeUserVideo', userId)
            
            socket.emit('forceDisconnect','Bye kind sir !') //disconnecting the dude who clicked 'leave' from the server
        }

        //disconnecting people who exited browser
        socket.on('disconnect',()=>{ //issues here. If user disconnects via peer, we use "userGone" 
        //tell other users he is gone even though peer is closed and that they should delete his video box.
            socket.to(roomId).broadcast.emit('removeUserVideo', userId)
            console.log(`User with the id ${userId} has exited via browser`);
        })
    })
    
    
    
})
server.listen((process.env.PORT || port),()=>{
    console.log(`Server started at http://localhost:${port}`);
})