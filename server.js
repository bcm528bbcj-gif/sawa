<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>رزان</title>

  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #090513;
      color: white;
      text-align: center;
    }

    header {
      padding: 18px;
      font-size: 25px;
      font-weight: bold;
      border-bottom: 1px solid #35264b;
    }

    .container {
      width: 92%;
      max-width: 700px;
      margin: 30px auto;
    }

    .card {
      background: #151020;
      padding: 22px;
      border-radius: 20px;
      margin-bottom: 20px;
    }

    input {
      width: 100%;
      padding: 14px;
      margin: 7px 0;
      border: 1px solid #493b60;
      border-radius: 12px;
      background: #0c0912;
      color: white;
      font-size: 16px;
    }

    button {
      width: 100%;
      padding: 14px;
      margin: 7px 0;
      border: 0;
      border-radius: 12px;
      background: #7c3aed;
      color: white;
      font-size: 17px;
      font-weight: bold;
      cursor: pointer;
    }

    .services {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 15px 0;
    }

    .service {
      background: #21182e;
      min-height: 75px;
    }

    video {
      width: 100%;
      background: black;
      border-radius: 14px;
      margin-top: 10px;
    }

    #messages {
      height: 180px;
      overflow-y: auto;
      text-align: right;
      background: #0c0912;
      padding: 12px;
      border-radius: 12px;
      margin-top: 15px;
    }

    .hidden { display: none; }
  </style>
</head>

<body>

<header>🎬 رزان</header>

<div class="container">

  <div id="home" class="card">
    <h2>🍿 شاهدوا رزان</h2>

    <input id="name" placeholder="اسمك">

    <button onclick="createRoom()">إنشاء غرفة</button>

    <input id="roomInput" placeholder="اكتب رمز الغرفة">

    <button onclick="joinRoom()">دخول الغرفة</button>
  </div>

  <div id="room" class="card hidden">

    <h2>الغرفة</h2>
    <h3 id="roomCode"></h3>

    <h3>اختر منصة المشاهدة</h3>

    <div class="services">
      <button class="service" onclick="openService('https://www.netflix.com')">
        Netflix
      </button>

      <button class="service" onclick="openService('https://shahid.mbc.net')">
        شاهد
      </button>

      <button class="service" onclick="openService('https://www.youtube.com')">
        YouTube
      </button>

      <button class="service" onclick="openService('https://www.primevideo.com')">
        Prime Video
      </button>
    </div>

    <input id="videoUrl" placeholder="رابط فيديو مباشر">
    <button onclick="loadVideo()">تشغيل الفيديو</button>

    <video id="video" controls playsinline></video>

    <div id="messages"></div>

    <input id="messageInput" placeholder="اكتب رسالة...">
    <button onclick="sendMessage()">إرسال</button>

  </div>

</div>

<script src="/socket.io/socket.io.js"></script>

<script>
const socket = io();

let currentRoom = "";
let userName = "";

const home = document.getElementById("home");
const roomPage = document.getElementById("room");
const roomCode = document.getElementById("roomCode");
const video = document.getElementById("video");
const messages = document.getElementById("messages");

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

function createRoom() {
  userName = document.getElementById("name").value.trim() || "ضيف";
  currentRoom = makeCode();

  enterRoom();
}

function joinRoom() {
  userName = document.getElementById("name").value.trim() || "ضيف";
  currentRoom = document.getElementById("roomInput").value.trim().toUpperCase();

  if (!currentRoom) return;

  enterRoom();
}

function enterRoom() {
  socket.emit("join", {
    room: currentRoom,
    name: userName
  });

  roomCode.textContent = currentRoom;
  home.classList.add("hidden");
  roomPage.classList.remove("hidden");
}

function openService(url) {
  window.open(url, "_blank");
}

function loadVideo() {
  const url = document.getElementById("videoUrl").value.trim();

  if (!url) return;

  video.src = url;
  video.load();

  socket.emit("video", url);
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();

  if (!text) return;

  socket.emit("chat", {
    text: text,
    name: userName
  });

  input.value = "";
}

socket.on("video", (url) => {
  if (!url) return;

  video.src = url;
  video.load();
});

socket.on("sync", (data) => {
  if (!data) return;

  if (Math.abs(video.currentTime - Number(data.time || 0)) > 1) {
    video.currentTime = Number(data.time || 0);
  }

  if (data.playing) {
    video.play().catch(() => {});
  } else {
    video.pause();
  }
});

video.addEventListener("play", () => {
  socket.emit("sync", {
    time: video.currentTime,
    playing: true
  });
});

video.addEventListener("pause", () => {
  socket.emit("sync", {
    time: video.currentTime,
    playing: false
  });
});

video.addEventListener("seeked", () => {
  socket.emit("sync", {
    time: video.currentTime,
    playing: !video.paused
  });
});

socket.on("chat", (data) => {
  const div = document.createElement("div");

  if (typeof data === "string") {
    div.textContent = data;
  } else {
    div.textContent = (data.name || "ضيف") + ": " + (data.text || "");
  }

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("system", (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  messages.appendChild(div);
});

</script>

</body>
</html>