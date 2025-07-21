/* eslint-disable no-console */
let socket;

const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true; // ensures that we do not hear ourselves
myVideo.playsInline = 'true';

const joinBtn = document.querySelector('#join-btn');

const connectToNewUser = (peer, peerId, stream) => {
    console.log(
        `User ${peerId} has joined the socket room. Initiating peer call`
    );

    const call = peer.call(peerId, stream);
    const video = document.createElement('video');
    video.playsInline = 'true';

    call.on('stream', (userVideoStream) => {
        console.log('got stream of other person');
        addVideoStream(video, userVideoStream, peerId);
    });
};

const addVideoStream = (video, stream, videoId) => {
    video.srcObject = stream;
    if (videoId) {
        video.id = videoId;
    }
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
    setHeightOfVideos(); //added
};
// ----------------------------------------------------------------------------------

// switching between sharing screen and not sharing
var sharingNow = false;

async function toggleScreenShare(peer, myVideoStream) {
    let sender;
    const myPeers = Object.keys(peer.connections);

    if (sharingNow === false) {
        var shareScreen = await navigator.mediaDevices.getDisplayMedia();
        document.getElementById('shareScreen').firstChild.className =
            'far fa-newspaper';

        for (let i = 0; i < myPeers.length; i++) {
            sender =
                peer.connections[myPeers[i]][0].peerConnection.getSenders();
            const [track] = shareScreen.getVideoTracks();
            sender[1].replaceTrack(track);
        }

        sharingNow = true;
        document.querySelectorAll('video')[0].srcObject = shareScreen;
    } else {
        document.getElementById('shareScreen').firstChild.className =
            'far fa-newspaper red'; //no good symbol for sharing screen

        for (let i = 0; i < myPeers.length; i++) {
            sender =
                peer.connections[myPeers[i]][0].peerConnection.getSenders();
            sender[1].replaceTrack(myVideoStream.getVideoTracks()[0]);
        }

        document.querySelectorAll('video')[0].srcObject = myVideoStream;
        // toggleVideo()
        sharingNow = false;
    }
}

// ----------------------------------------------------------------------------------------

//muting my audio
const toggleAudio = (myVideoStream) => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        document.getElementById('toggleAudio').firstChild.className =
            'fas fa-microphone-alt-slash red';
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        document.getElementById('toggleAudio').firstChild.className =
            'fas fa-microphone-alt';
    }
};

//muting my video
const toggleVideo = (myVideoStream) => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        document.getElementById('toggleVideo').firstChild.className =
            'fas fa-video-slash red';
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        document.getElementById('toggleVideo').firstChild.className =
            'fas fa-video';
    }
};
const a = 2;
console.warn(a);
const setHeightOfVideos = () => {
    var height = document.getElementById('canvas').clientHeight;
    console.log(height);
    var videos = document.querySelectorAll('video');
    videos.forEach((video) => {
        if (videos.length <= 2) {
            video.style.height = height / 2 + 'px';
        } else if (videos.length > 2 && videos.length <= 6) {
            video.style.height = height / 3 + 'px';
        } else if (videos.length >= 7) {
            video.style.height = height / 4 + 'px';
        }
    });
};

const connect = () => {
    joinBtn.classList.add('hidden');

    //connecting to peer from client
    // eslint-disable-next-line no-undef
    var peer = new Peer(undefined, {
        host: window.location.hostname,
        path: '/peerjs',
        // eslint-disable-next-line no-undef
        port: PEER_PORT,
        iceServers: [
            // eslint-disable-next-line no-undef
            ...iceServers,
        ],
    });

    let myVideoStream;

    // first wait to connect to the peer server
    peer.on('open', async (peerId) => {
        // eslint-disable-next-line no-undef
        socket = io({
            query: {
                roomId: window.location.pathname.split('/').pop(),
                peerId: peerId,
            },
        });

        document
            .getElementById('toggleAudio')
            .addEventListener('click', () => toggleAudio(myVideoStream));
        document
            .getElementById('toggleVideo')
            .addEventListener('click', () => toggleVideo(myVideoStream));
        document
            .getElementById('shareScreen')
            .addEventListener('click', () =>
                toggleScreenShare(peer, myVideoStream)
            );
        window.addEventListener('resize', setHeightOfVideos);

        document.querySelector('#buttons').classList.remove('hidden');

        console.log('My peer ID is: ' + peerId);

        // after that wait for media stream
        navigator.mediaDevices
            .getUserMedia({
                video: true,
                audio: true,
            })
            .then((stream) => {
                myVideoStream = stream;
                addVideoStream(myVideo, stream);

                peer.on('call', (call) => {
                    console.log('Received a call...');

                    call.answer(stream);

                    const video = document.createElement('video');
                    video.playsInline = 'true';

                    call.on('stream', (userVideoStream) => {
                        console.log(
                            `User video stream received: ${userVideoStream} for peer ${call.peer}. Adding their video to our box`
                        );
                        addVideoStream(video, userVideoStream, call.peer);
                    });
                });

                // eslint-disable-next-line no-undef
                socket.emit('joinRoom', ROOM_ID, peerId);

                socket.on('userConnected', (peerId) =>
                    connectToNewUser(peer, peerId, stream)
                );

                //removing video of user who has disconnected from websocket
                socket.on('removeUserVideo', (peerId) =>
                    removeVideoElement(peerId)
                );

                // -DISCONNECT FUNCTION - disconnecting this user from websocket. This will trigger the on.disconnected listener on the server.
                //this will tell other sockets to remove the video of the user who has just disconnected (video id is the same as the userId)
                socket.on('forceDisconnect', () => {
                    socket.close();
                    console.log(
                        `You have been disconnected from websocket. The road ends here. `
                    );
                });
            });
    });

    peer.on('connection', () => {
        console.log('peer connection established');
    });

    //once disconnected from peer, we tell the server this. The server will tell disconnect this user from websocket (see -DISCONNECT FUNCTION - )
    peer.on('close', (id) => {
        console.log(
            `Peer destroyed : ${peer.destroyed}. Letting Everyone else on in the room know.`
        );
        socket.emit('peerLeft', id);
    });

    peer.on('disconnected', () => {
        console.log('Peer disconnected');
    });

    //client click to end call and stays in browser
    document.getElementById('destroyPeer').addEventListener('click', () => {
        peer.destroy();

        //removing all videos for client who is leaving.
        var videoNodes = document.querySelectorAll('video');
        videoNodes.forEach((node) => {
            node.remove();
        });

        joinBtn.querySelector('button').innerText = 'Re-join Call';
        joinBtn.classList.remove('hidden');
        document.querySelector('#buttons').classList.add('hidden');
    });
};

function removeVideoElement(id) {
    var vidElement = document.getElementById(id);
    if (vidElement) {
        vidElement.remove();
        setHeightOfVideos();
    }
}

joinBtn.addEventListener('click', connect);
