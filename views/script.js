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

let myVideoStream; //the videoStream is now available to all

navigator.mediaDevices.getUserMedia({
    video:true,
    audio:true
}).then(stream => {
    myVideoStream = stream;
    addVideoStream(myVideo,stream)
    
    peer.on('call',call=>{ //---> ovde se gubi nesto
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

    socket.on('removeUserVideo',disconnectedPeerId=>{ //doesnt work
        console.log(`Remove video id: ${disconnectedPeerId}`);
        document.getElementById(disconnectedPeerId).remove()
    })

    socket.on('closeYourPeer',()=>{
        peer.destroy()
    })
})

peer.on('open', id=>{
    // console.log(`Your id: ${id} and room id:${ROOM_ID}. Emiting 'join-room'`);
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
//once disconnected, this happens:
peer.on('close',()=>{
    console.log(`Peer destroyed : ${peer.destroyed}. Letting Everyone else on in the room know.`);
    socket.emit('peerLeft',myId)
})

peer.on('disconnected',()=>{
    console.log('Someone has just left the peer server');
})


//------------ I have no comment the previous peer.on(call) and uncomment this to work for 1 user
// peer.on('call',call=>{ //---> ovde se gubi nesto
//     console.log(`Someone is calling. Call info: ${call}...answering...`);
//     console.log(call);
//     call.answer(myVideoStream)
//     const video = document.createElement('video')
//     call.on('stream',uservideoStream=>{
//         console.log(`User video stream received: ${uservideoStream}. Adding to our box`);
//         addVideoStream(video,uservideoStream)
//     }) //---- somewhere here we may need to call the guy who first send out the signal
// })
//------------

