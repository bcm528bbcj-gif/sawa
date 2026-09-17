const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const rooms = new Map();

io.on("connection", (socket) => {

  socket.on("join", ({ room, name }) => {
    if (!room) return;

    room = String(room).toUpperCase();

    socket.join(room);
    socket.data.room = room;
    socket.data.name = name || "زائر";

    if (!rooms.has(room)) {
      rooms.set(room, {
        video: "",
        youtube: "",
        time: 0,
        playing: false,
        youtubeTime: 0,
        youtubePlaying: false
      });
    }

    socket.emit("room-state", rooms.get(room));

    io.to(room).emit(
      "system",
      `${socket.data.name} دخل الغرفة`
    );
  });


  /* =====================
     CHAT
  ===================== */

  socket.on("chat", (text) => {
    const room = socket.data.room;
    if (!room) return;

    const message = String(text || "").trim();
    if (!message) return;

    io.to(room).emit("chat", {
      name: socket.data.name || "زائر",
      text: message.slice(0, 500)
    });
  });


  /* =====================
     MP4
  ===================== */

  socket.on("video", (url) => {
    const room = socket.data.room;

    if (!room || !rooms.has(room)) return;

    const state = rooms.get(room);

    state.video = String(url || "").slice(0, 2000);
    state.youtube = "";

    state.time = 0;
    state.playing = false;

    state.youtubeTime = 0;
    state.youtubePlaying = false;

    io.to(room).emit("video", state.video);
  });


  socket.on("sync", (data) => {
    const room = socket.data.room;

    if (!room || !rooms.has(room)) return;

    const state = rooms.get(room);

    state.time = Number(data.time) || 0;
    state.playing = !!data.playing;

    socket.to(room).emit("sync", {
      time: state.time,
      playing: state.playing
    });
  });


  /* =====================
     YOUTUBE
  ===================== */

  socket.on("youtube", (url) => {
    const room = socket.data.room;

    if (!room || !rooms.has(room)) return;

    const state = rooms.get(room);

    state.youtube = String(url || "").slice(0, 2000);
    state.video = "";

    state.youtubeTime = 0;
    state.youtubePlaying = false;

    io.to(room).emit("youtube", state.youtube);
  });


  /*
    مزامنة YouTube
    تشغيل / إيقاف / تقديم
  */

  socket.on("youtube-sync", (data) => {
    const room = socket.data.room;

    if (!room || !rooms.has(room)) return;

    const state = rooms.get(room);

    state.youtubeTime =
      Math.max(0, Number(data.time) || 0);

    state.youtubePlaying =
      !!data.playing;

    socket.to(room).emit("youtube-sync", {
      time: state.youtubeTime,
      playing: state.youtubePlaying
    });
  });


  /* =====================
     NETFLIX
  ===================== */

  socket.on("netflix", (url) => {
    const room = socket.data.room;

    if (!room) return;

    const netflixUrl = String(
      url || "https://www.netflix.com/"
    ).slice(0, 2000);

    socket.to(room).emit(
      "netflix",
      netflixUrl
    );
  });


  /* =====================
     DISCONNECT
  ===================== */

  socket.on("disconnect", () => {
    const room = socket.data.room;

    if (room) {
      socket.to(room).emit(
        "system",
        `${socket.data.name || "زائر"} خرج من الغرفة`
      );
    }
  });

});


const PORT =
process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(
    `Razan running on port ${PORT}`
  );
});