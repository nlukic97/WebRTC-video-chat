const socket = io('/')

const videoGrid = document.getElementById('video-grid')
const myVideo = document.createElement('video')
myVideo.muted = true;

const connectToNewUser = (userId, stream) =>{
    const call = peer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', uservideoStream => {
        console.log('got stream of other person')
        addVideoStream(video, uservideoStream)
    })
}

const addVideoStream = (video, stream) =>{
    video.srcObject = stream;
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
            addVideoStream(video,userVideoStream)
        })
    })

    peer.on('disconnected',()=>{
        console.log('peer disconnected');
    })
    
    peer.on('connection',()=>{
        console.log('peer connection established');
    })
    
    socket.on('user-connected',(userId)=>{
        // console.log(`Another user has joined. Their id: ${userId}. Contacting them...`);
        connectToNewUser(userId, stream)
    })
})

peer.on('open', id=>{
    // console.log(`Your id: ${id} and room id:${ROOM_ID}. Emiting 'join-room'`);
    socket.emit('join-room', ROOM_ID, id)
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

