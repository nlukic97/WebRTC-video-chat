/**
 * @todo complete refactor needed to mediasoup,
 * app is currently still uses original Peerjs signalling and p2p connection.
 */

import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from '../domains/room-v2/room.events.ts';
// import * as mediasoupClient from 'mediasoup-client';

const videoGrid = document.getElementById('video-grid');
if (!videoGrid) {
    throw Error('No video grid found');
}

const myVideoEl = document.createElement('video');
myVideoEl.muted = true; // ensures that we do not hear ourselves
myVideoEl.playsInline = true;

let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

const roomId = window.location.pathname.split('/').pop();
if (!roomId) {
    throw Error('No room id found');
}

const joinBtn = document.querySelector('#join-btn');
if (!joinBtn) {
    throw Error('JoinBtn element not found');
}

const addVideoStream = (
    video: HTMLVideoElement,
    stream: MediaStream,
    videoId: string | undefined
) => {
    video.srcObject = stream;

    if (videoId) {
        video.id = videoId;
    }

    video.addEventListener('loadedmetadata', () => {
        video.play();
    });

    videoGrid.append(video);

    setHeightOfVideos();
};

const setHeightOfVideos = () => {
    const canvas = document.getElementById('canvas');

    if (!canvas) {
        console.error('No video canvas element found');
        return;
    }

    const height = canvas.clientHeight;
    const videos = document.querySelectorAll('video');

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
    const joinBtn = document.querySelector('#join-btn');
    if (!joinBtn) {
        throw Error('JoinBtn element not found');
    }
    joinBtn.classList.add('hidden');

    // first wait to connect to the socket server
    socket = io('/v2', {
        query: {
            roomId,
        },
    });

    window.addEventListener('resize', setHeightOfVideos);

    const buttons = document.querySelector('#buttons');
    if (!buttons) {
        console.error('No buttons element found');
        return;
    }
    buttons.classList.remove('hidden');

    // after that wait for media stream
    navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: true,
        })
        .then((stream) => {
            addVideoStream(myVideoEl, stream, socket.id);

            socket.emit('joinRoom', roomId);

            socket.on('rtpCapabilities', (rtpCapabilities) => {
                // @todo do something with RTP capabilities
                // eslint-disable-next-line no-console
                console.log('received rtp capabilities', rtpCapabilities);
            });

            //removing video of user who has disconnected from websocket
            socket.on('removeUserVideo', (peerId) =>
                removeVideoElement(peerId)
            );

            // -DISCONNECT FUNCTION - disconnecting this user from websocket. This will trigger the on.disconnected listener on the server.
            //this will tell other sockets to remove the video of the user who has just disconnected (video id is the same as the userId)
            socket.on('forceDisconnect', () => {
                socket.disconnect(); // @todo check if this is ok
                // eslint-disable-next-line no-console
                console.log(
                    `You have been disconnected from websocket. The road ends here. `
                );
            });
        });

    //client click to end call and stays in browser
    const destroyPeerBtn = document.getElementById('destroyPeer');
    if (!destroyPeerBtn) {
        console.error('DestroyPeerBtn not found');
        return;
    }

    destroyPeerBtn.addEventListener('click', () => {
        // socket.emit('leaveRoom'); // tell server you are leaving
        socket.disconnect(); // maybe this is better? @todo

        //removing all videos for client who is leaving.
        const videoNodes = document.querySelectorAll('video');
        videoNodes.forEach((node) => {
            node.remove();
        });

        const joinBtn = document.querySelector('#join-btn');
        if (!joinBtn) {
            throw Error('JoinBtn element not found');
        }
        const joinBtnButton = joinBtn.querySelector('button');
        if (!joinBtnButton) {
            throw Error('Join button not found');
        }

        joinBtnButton.innerText = 'Re-join Call';

        joinBtn.classList.remove('hidden');
        buttons.classList.add('hidden');
    });
};

function removeVideoElement(id: string) {
    const vidElement = document.getElementById(id);
    if (vidElement) {
        vidElement.remove();
        setHeightOfVideos();
    }
}

joinBtn.addEventListener('click', connect);
