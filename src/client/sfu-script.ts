/**
 * @todo rafactor in progress
 * app currently also uses original Peerjs signalling and p2p connection
 */

import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';

import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from '../domains/room-v2/room.events.ts';
import * as mediasoupClient from 'mediasoup-client';
import type {
    RtpCapabilities,
    DtlsParameters,
    IceCandidate,
    IceParameters,
    Producer,
    Transport,
} from 'mediasoup-client/types';

const videoGrid = document.getElementById('video-grid');
if (!videoGrid) {
    throw Error('No video grid found');
}

const myVideoEl = document.createElement('video');
myVideoEl.muted = true; // ensures that we do not hear ourselves
myVideoEl.playsInline = true;

let socket: Socket<ServerToClientEvents, ClientToServerEvents>;

let device: mediasoupClient.Device;

let stream: MediaStream;

let sendTransport: Transport;
let receiveTransport: Transport;

let videoProducer: Producer;
let audioProducer: Producer;

const roomId = window.location.pathname.split('/').pop();
if (!roomId) {
    throw Error('No room id found');
}

const joinBtn = document.querySelector('#join-btn');
if (!joinBtn) {
    throw Error('JoinBtn element not found');
}

const displayVideoStreamInVideoElement = (
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

const loadDevice = async (rtpCapabilities: RtpCapabilities) => {
    // audit log
    console.log(`Received rtpCapabilities`, rtpCapabilities);

    // create new mediasoup device
    device = new mediasoupClient.Device();

    device.observer.on('newtransport', (transport) => {
        console.log(
            `new ${transport.direction} transport created for device`,
            transport
        );
    });

    await device.load({
        routerRtpCapabilities: rtpCapabilities,
    });
};

type TransportDataType = {
    id: string;
    iceParameters: IceParameters;
    iceCandidates: IceCandidate[];
    dtlsParameters: DtlsParameters;
};

const handleWebRtcTransportsCreated = async (transports: {
    sendTransportData: TransportDataType;
    receiveTransportData: TransportDataType;
}) => {
    try {
        // transports
        sendTransport = device.createSendTransport(
            transports.sendTransportData
        );

        receiveTransport = device.createRecvTransport(
            transports.receiveTransportData
        );

        // getting stream
        stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        if (!stream) {
            throw Error('Stream undefined');
        }

        // video track
        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) {
            throw Error('VideoTrack is not found');
        }

        // audio track
        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) {
            throw Error('AudioTrack is not found');
        }

        sendTransport.on('connect', async ({ dtlsParameters }, callback) => {
            console.log('Emitting transportConnect');
            await socket.emitWithAck('transportConnect', {
                roomId,
                transportId: sendTransport.id,
                dtlsParameters: dtlsParameters,
            });

            callback();
        });

        // when producing of video or audio starts
        sendTransport.on('produce', async (parameters, callback) => {
            const { id } = await socket.emitWithAck('makeProducer', {
                roomId,
                parameters,
            });
            callback({ id });
        });

        // // audio producer
        audioProducer = await sendTransport.produce({
            track: audioTrack,
        });

        // video producer
        videoProducer = await sendTransport.produce({
            track: videoTrack,
        });

        displayVideoStreamInVideoElement(myVideoEl, stream, socket.id);

        receiveTransport.on('connect', () => {
            console.log('Receive transport connect');
        });
    } catch (err) {
        console.log(err);
    }
};

const connect = async () => {
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

    //removing video of user who has disconnected from websocket
    // socket.on('removeUserVideo', (socketId) => removeVideoElement(socketId));

    socket.on('userConnected', () => {
        console.log('user connected');
    });

    try {
        // join the room, the server replies with the router's rtpCapabilities
        const rtpCapabilities = await socket.emitWithAck('joinRoom', roomId);
        await loadDevice(rtpCapabilities);

        // if device can produce video and audio, create transports and start producing
        if (device.canProduce('video') && device.canProduce('audio')) {
            const transports = await socket.emitWithAck(
                'createWebRtcTransports',
                roomId
            );
            await handleWebRtcTransportsCreated(transports);
        }
    } catch (err) {
        console.error(err);
    }

    //client click to end call and stays in browser
    const destroyPeerBtn = document.getElementById('destroyPeer');
    if (!destroyPeerBtn) {
        return;
    }

    destroyPeerBtn.addEventListener('click', () => {
        // server's 'disconnect' handler removes us from the room and tells the others
        socket.disconnect();

        videoProducer.close();
        audioProducer.close();
        sendTransport.close();
        receiveTransport.close();
        // @todo more cleanup might be needed here

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

/* function removeVideoElement(id: string) {
    const vidElement = document.getElementById(id);
    if (vidElement) {
        vidElement.remove();
        setHeightOfVideos();
    }
} */

joinBtn.addEventListener('click', connect);
