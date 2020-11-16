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
    setHeightOfVideos() //added
}

//muting my audio
const toggleAudio = () =>{
    console.log(myVideoStream);
    const enabled = myVideoStream.getAudioTracks()[0].enabled
    if(enabled){
        myVideoStream.getAudioTracks()[0].enabled = false
        document.getElementById('toggleAudio').firstChild.className = 'fas fa-microphone-alt-slash red';
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true
        document.getElementById('toggleAudio').firstChild.className = 'fas fa-microphone-alt';
    }
}

document.getElementById('toggleAudio').addEventListener('click',()=>{
    toggleAudio()
})


//muting my video
const toggleVideo = () =>{
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if(enabled){
        myVideoStream.getVideoTracks()[0].enabled = false
        document.getElementById('toggleVideo').firstChild.className = 'fas fa-video-slash red';
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true
        document.getElementById('toggleVideo').firstChild.className = 'fas fa-video';
    }
}

document.getElementById('toggleVideo').addEventListener('click',()=>{
    toggleVideo()
})


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
            console.log(userVideoStream);
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

        var vidElement = document.getElementById(disconnectedPeerId) //delete element only if it exists. Error happens without this
        if(vidElement){
            vidElement.remove()
            setHeightOfVideos()
        }
    })

    // -DISCONNECT FUNCTION - disconnecting this user from websocket. This will trigger the on.disconnected listener on the server.
    //this will tell other sockets to remove the video of the user who has just disconnected (video id is the same as the userId)
    socket.on('forceDisconnect',msg=>{
        socket.close()
        console.log(`You have been disconnected from websocket. The road ends here. `);
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

//----- styling
const setHeightOfVideos = () =>{
    var height = document.getElementById('canvas').clientHeight
    console.log(height);
    var videos = document.querySelectorAll('video')
    videos.forEach(video=>{
        if(videos.length <=2){
            video.style.height = height/2 + 'px'
        }
        else if(videos.length > 2 && videos.length <=6){
            video.style.height = height/3 + 'px'
        } else if(videos.length >=7){
            video.style.height = height/4 + 'px'
        }
    })
}

window.addEventListener('resize',()=>{
    setHeightOfVideos()
})

