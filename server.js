const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Triangle</title>
  <style>
    body { font-family: Arial; text-align: center; background: #f4f4f4; }
    video { width: 45%; margin: 10px; border: 1px solid #ccc; }
    #chat { height: 200px; overflow-y: scroll; background: white; margin: 10px auto; width: 80%; border: 1px solid #ccc; padding: 10px; }
    input { width: 60%; padding: 10px; }
    button { padding: 10px 20px; }
  </style>
</head>
<body>
  <h1>Triangle</h1>
  <video id="localVideo" autoplay muted></video>
  <video id="remoteVideo" autoplay></video>
  <div id="chat"></div>
  <input type="text" id="message" placeholder="Type your message..." />
  <button onclick="sendMessage()">Send</button>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const chat = document.getElementById('chat');
    const messageInput = document.getElementById('message');

    let peerConnection;
    const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      localVideo.srcObject = stream;

      socket.emit('ready');

      socket.on('offer', offer => {
        peerConnection = new RTCPeerConnection(config);
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        peerConnection.createAnswer().then(answer => {
          peerConnection.setLocalDescription(answer);
          socket.emit('answer', answer);
        });
        peerConnection.ontrack = e => remoteVideo.srcObject = e.streams[0];
        peerConnection.onicecandidate = e => {
          if (e.candidate) socket.emit('candidate', e.candidate);
        };
      });

      socket.on('answer', answer => {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      });

      socket.on('candidate', candidate => {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.on('ready', () => {
        peerConnection = new RTCPeerConnection(config);
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        peerConnection.ontrack = e => remoteVideo.srcObject = e.streams[0];
        peerConnection.onicecandidate = e => {
          if (e.candidate) socket.emit('candidate', e.candidate);
        };
        peerConnection.createOffer().then(offer => {
          peerConnection.setLocalDescription(offer);
          socket.emit('offer', offer);
        });
      });
    });

    function sendMessage() {
      const msg = messageInput.value;
      if (msg.trim()) {
        chat.innerHTML += \`<p><strong>You:</strong> \${msg}</p>\`;
        socket.emit('message', msg);
        messageInput.value = '';
      }
    }

    socket.on('message', msg => {
      chat.innerHTML += \`<p><strong>Stranger:</strong> \${msg}</p>\`;
    });
  </script>
</body>
</html>
  `);
});

let waiting = null;

io.on('connection', socket => {
  if (waiting) {
    socket.partner = waiting;
    waiting.partner = socket;
    waiting.emit('ready');
    socket.emit('ready');
    waiting = null;
  } else {
    waiting = socket;
  }

  socket.on('offer', offer => {
    if (socket.partner) socket.partner.emit('offer', offer);
  });

  socket.on('answer', answer => {
    if (socket.partner) socket.partner.emit('answer', answer);
  });

  socket.on('candidate', candidate => {
    if (socket.partner) socket.partner.emit('candidate', candidate);
  });

  socket.on('message', msg => {
    if (socket.partner) socket.partner.emit('message', msg);
  });

  socket.on('disconnect', () => {
    if (socket.partner) socket.partner.emit('disconnect');
    if (waiting === socket) waiting = null;
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
