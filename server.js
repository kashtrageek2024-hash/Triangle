const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public'))); // Serve your HTML/CSS/JS

let waitingSocket = null;

io.on('connection', socket => {
  console.log('🔌 New user connected:', socket.id);

  if (waitingSocket) {
    // Pair the two users
    socket.partner = waitingSocket;
    waitingSocket.partner = socket;

    socket.emit('partner-found');
    waitingSocket.emit('partner-found');

    waitingSocket = null;
  } else {
    waitingSocket = socket;
  }

  socket.on('message', msg => {
    if (socket.partner) {
      socket.partner.emit('message', msg);
    }
  });

  socket.on('ready-for-video', () => {
    if (socket.partner) {
      socket.partner.emit('ready-for-video');
    }
  });

  socket.on('video-offer', offer => {
    if (socket.partner) {
      socket.partner.emit('video-offer', offer);
    }
  });

  socket.on('video-answer', answer => {
    if (socket.partner) {
      socket.partner.emit('video-answer', answer);
    }
  });

  socket.on('ice-candidate', candidate => {
    if (socket.partner) {
      socket.partner.emit('ice-candidate', candidate);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    if (socket.partner) {
      socket.partner.emit('partner-disconnected');
      socket.partner.partner = null;
    }
    if (waitingSocket === socket) {
      waitingSocket = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
