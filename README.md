# PeerJS Video Chat

A simple, modern, and self-hosted video chat application built with Node.js, Express, WebRTC (via PeerJS), and Socket.IO. Inspired by Zoom, this app allows users to create or join video chat rooms with real-time audio, video, and screen sharing.

## Features

- **One-click Room Creation:** Landing on the homepage redirects you to a unique room URL.
- **Peer-to-Peer Video/Audio:** Uses WebRTC (via PeerJS) for direct media connections between users.
- **Screen Sharing:** Share your screen with other participants.
- **Mute/Unmute Audio & Video:** Toggle your microphone and camera during a call.
- **Responsive UI:** Clean, modern interface that works on desktop and mobile.
- **Room-based:** Each room is a unique URL; share it to invite others.
- **Logging:** Server logs to `logs/node.log` (info, warnings, errors, memory/CPU usage in development).

## How It Works

- The server uses Express to serve the frontend and handle routing.
- Socket.IO manages real-time signaling and room membership.
- PeerJS handles WebRTC peer-to-peer connections for video/audio streams.
- Public Google STUN servers are used for NAT traversal (see `src/utils/iceServers.js`).
- The frontend (EJS + vanilla JS) provides the video grid, controls, and screen sharing.

## Project Structure

```
peerJs-videoChat/
├── src/
│   ├── server.js           # Main server (Express, Socket.IO, PeerJS)
│   ├── utils/
│   │   ├── iceServers.js   # STUN server config
│   │   ├── Log.js          # Logger utility
│   │   └── LogMemoryUsage.js # Memory/CPU logging
│   └── views/
│       ├── room/
│       │   └── index.ejs   # Main room UI
│       ├── script.js       # Frontend logic
│       └── style.css       # Styles
├── logs/
│   └── node.log            # Server logs
├── package.json
└── README.md
```

## Local Setup

### 1. Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- [npm](https://www.npmjs.com/)

### 2. Clone the Repository

```bash
git clone https://github.com/nlukic97/peerJs-videoChat.git
cd peerJs-videoChat
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Variables

Create a `.env` file in the root directory. Example:

```
# .env
HOST=localhost
PORT=443           # Main server port (use 443 for HTTPS, 80 for HTTP)
PEER_PORT=9000     # PeerJS server port
USE_HTTPS=false    # Set to 'true' to enable HTTPS (see below)
ENV=development    # 'production' or 'development'
```

#### HTTPS (Optional but recommended for production)

- If `USE_HTTPS=true`, place your SSL certificate and key in `cert/selfsigned.crt` and `cert/selfsigned.key`.
- For local development, you can generate a self-signed certificate:
    ```bash
    mkdir cert
    openssl req -nodes -new -x509 -keyout cert/selfsigned.key -out cert/selfsigned.crt
    ```

### 5. Start the Server

- For production:
    ```bash
    npm start
    ```
- For development (with auto-reload):
    ```bash
    npm run dev
    ```

### 6. Open in Browser

Visit [http://localhost:443](http://localhost:443) (or the port you set). You will be redirected to a unique room URL. Share this URL to invite others.

## Usage

- Click **Join Call** to enter the room.
- Use the bottom controls to mute/unmute audio/video, share your screen, or leave the call.
- To invite others, share the room URL from your browser's address bar.

## Dependencies

- [Express](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [PeerJS](https://peerjs.com/)
- [EJS](https://ejs.co/)
- [dotenv](https://github.com/motdotla/dotenv)
- [uuid](https://www.npmjs.com/package/uuid)
- [nodemon](https://nodemon.io/) (dev only)

## Logging

- Logs are written to `logs/node.log`.
- In development, logs are also printed to the console.
- Includes memory and CPU usage info (see `src/utils/LogMemoryUsage.js`).

## Notes

- Uses public Google STUN servers by default. For production, consider adding TURN servers for better reliability behind firewalls/NATs.
- The UI is intentionally minimal and can be customized in `src/views/style.css` and `src/views/room/index.ejs`.

## License

ISC
