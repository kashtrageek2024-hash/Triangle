<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Triangle</title>
  <link rel="icon" href="/favicon.ico" type="image/x-icon" />
  <script src="https://cdn.jsdelivr.net/npm/@joeattardi/emoji-button@4.6.2/dist/index.min.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background: linear-gradient(to right, #0f2027, #203a43, #2c5364);
      color: white;
      margin: 0;
      padding: 0;
      text-align: center;
    }

    h1 {
      margin-top: 30px;
      font-size: 3em;
      letter-spacing: 2px;
    }

    #chat {
      margin: 40px auto;
      width: 80%;
      max-width: 600px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 20px;
    }

    #avatar {
      border-radius: 50%;
      margin-bottom: 10px;
    }

    #messages {
      text-align: left;
      margin-bottom: 20px;
    }

    input[type="text"] {
      width: 70%;
      padding: 10px;
      border-radius: 5px;
      border: none;
      margin-top: 10px;
    }

    button {
      padding: 10px 20px;
      border: none;
      background-color: #00bcd4;
      color: white;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 10px;
    }

    button:hover {
      background-color: #0097a7;
    }

    #loading {
      margin-top: 20px;
      font-size: 1.2em;
      display: none;
    }

    footer {
      margin-top: 50px;
      color: #ccc;
    }
  </style>
</head>
<body>
  <h1>Triangle</h1>
  <div id="loading">🔄 Connecting you to a stranger...</div>
  <div id="chat" style="display:none;">
    <img id="avatar" src="" width="60" />
    <div id="messages"></div>
    <input id="input" type="text" placeholder="Type your message..." />
    <button onclick="sendMessage()">Send</button>
    <button id="emoji-btn">😊</button>
  </div>
  <footer>Made with ❤️ by Triangle Team | Gurugram, India</footer>

  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const loading = document.getElementById('loading');
    const chat = document.getElementById('chat');
    const messages = document.getElementById('messages');
    const input = document.getElementById('input');
    const avatar = document.getElementById('avatar');

    // Generate random avatar
    const avatarId = Math.random().toString(36).substring(7);
    avatar.src = `https://avatars.dicebear.com/api/identicon/${avatarId}.svg`;

    // Emoji picker
    const picker = new EmojiButton();
    document.getElementById('emoji-btn').addEventListener('click', () => {
      picker.togglePicker(document.getElementById('emoji-btn'));
    });
    picker.on('emoji', emoji => {
      input.value += emoji;
    });

    loading.style.display = 'block';

    socket.on('partner-found', () => {
      loading.style.display = 'none';
      chat.style.display = 'block';
      messages.innerHTML += '<p>✅ Connected to a stranger.</p>';
    });

    socket.on('message', (msg) => {
      messages.innerHTML += `<p>Stranger: ${msg}</p>`;
    });

    socket.on('partner-disconnected', () => {
      messages.innerHTML += '<p>❌ Stranger disconnected.</p>';
    });

    function sendMessage() {
      const msg = input.value;
      if (msg.trim()) {
        messages.innerHTML += `<p>You: ${msg}</p>`;
        socket.emit('message', msg);
        input.value = '';
      }
    }
  </script>
</body>
</html>
