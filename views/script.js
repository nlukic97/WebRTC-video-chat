const socket = io('/')
var myId; //later to be used to signal to others

const videoGrid = document.getElementById('video-grid')
const myVideo = document.createElement('video')
myVideo.muted = true;

const connectToNewUser = (userId, stream) =>{
    const call = peer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', uservideoStream => {
        console.log('got stream of other person')
        addVideoStream(video, uservideoStream, userId)
    })
}

const addVideoStream = (video, stream, vidId) =>{
    video.srcObject = stream;
    if(vidId){
        video.id = vidId
    }
    video.addEventListener('loadedmetadata',()=>{
        video.play()
    })
    videoGrid.append(video)
}

//connecting to peer from client
var peer = new Peer(undefined,{
    path:'/peerjs',
    host:'/',
    port:'443'
})

let myVideoStream;

navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo,stream)
    
    peer.on('call',call=>{
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream',userVideoStream=>{
            console.log(`User video stream received: ${userVideoStream}. Adding to our box`);
            console.log(`Adding user ${call.peer}`);
            addVideoStream(video,userVideoStream, call.peer)
        })
    })
    
    socket.on('user-connected',(userId)=>{
        // console.log(`Another user has joined. Their id: ${userId}. Contacting them...`);
        connectToNewUser(userId, stream)
    })

    //removing video of user who has disconnected from websocket
    socket.on('removeUserVideo',disconnectedPeerId=>{
        console.log(`Remove video id: ${disconnectedPeerId}`);
        document.getElementById(disconnectedPeerId).remove()
    })

    // -DISCONNECT FUNCTION - disconnecting this user from websocket. This will trigger the on.disconnected listener on the server.
    //this will tell other sockets to remove the video of the user who has just disconnected (video id is the same as the userId)
    socket.on('forceDisconnect',msg=>{
        socket.close()
        console.log(`You have been disconnected from websocket`);
    })
})

peer.on('open', id=>{
    socket.emit('join-room', ROOM_ID, id)
    myId = id;
})


peer.on('connection',()=>{
    console.log('peer connection established');
})


//client click to end call and stays in browser
document.getElementById('destroyPeer').addEventListener('click',()=>{
    peer.destroy()

    //removing all videos for client who is leaving.
    var videoNodes = document.querySelectorAll('video')
    videoNodes.forEach(node=>{
        node.remove()
    })
})

//once disconnected from peer, we tell the server this. The server will tell disconnect this user from websocket (see -DISCONNECT FUNCTION - )
peer.on('close',()=>{
    console.log(`Peer destroyed : ${peer.destroyed}. Letting Everyone else on in the room know.`);
    socket.emit('peerLeft',myId)
})

peer.on('disconnected',()=>{
    console.log('Peer disconnected');
})

