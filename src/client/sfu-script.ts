/**
 * @todo complete refactor needed to mediasoup,
 * app is currently still uses original Peerjs signalling and p2p connection.
 */

import type { Socket } from 'socket.io';
import * as mediasoupClient from 'mediasoup-client';

const videoGrid = document.getElementById('video-grid');
const joinBtn = document.querySelector('#join-btn');

const myVideo = document.createElement('video');
myVideo.muted = true; // ensures that we do not hear ourselves
myVideo.playsInline = true;

let socket: Socket;

const addVideoStream = (video, stream, videoId) => {
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
    const height = document.getElementById('canvas').clientHeight;
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
    joinBtn.classList.add('hidden');

    // first wait to connect to the peer server
    socket = io('/v2', {
        query: {
            roomId: window.location.pathname.split('/').pop(),
        },
    });

    window.addEventListener('resize', setHeightOfVideos);

    document.querySelector('#buttons').classList.remove('hidden');

    // after that wait for media stream
    navigator.mediaDevices
        .getUserMedia({
            video: true,
            audio: true,
        })
        .then((stream) => {
            addVideoStream(myVideo, stream);

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

    //client click to end call and stays in browser
    document.getElementById('destroyPeer').addEventListener('click', () => {
        //removing all videos for client who is leaving.
        const videoNodes = document.querySelectorAll('video');
        videoNodes.forEach((node) => {
            node.remove();
        });

        joinBtn.querySelector('button').innerText = 'Re-join Call';
        joinBtn.classList.remove('hidden');
        document.querySelector('#buttons').classList.add('hidden');
    });
};

function removeVideoElement(id) {
    const vidElement = document.getElementById(id);
    if (vidElement) {
        vidElement.remove();
        setHeightOfVideos();
    }
}

joinBtn.addEventListener('click', connect);
