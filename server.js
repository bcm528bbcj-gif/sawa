const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const rooms = new Map();

io.on("connection", (socket) => {

  // دخول الغرفة
  socket.on("join", ({ room, name }) => {

    if (!room) return;

    room = String(room).toUpperCase();

    socket.join(room);

    socket.data.room = room;
    socket.data.name = name || "زائر";

    if (!rooms.has(room)) {
      rooms.set(room, {
        youtube: "",
        youtubeTime: 0,
        youtubePlaying: false,

        video: "",
        videoTime: 0,
        videoPlaying: false
      });
    }

    socket.emit(
      "room-state",
      rooms.get(room)
    );

    io.to(room).emit(
      "system",
      `${socket.data.name} دخل الغرفة`
    );
  });


  // =========================
  // الدردشة
  // =========================

  socket.on("chat", (text) => {

    const room = socket.data.room;

    if (!room) return;

    const message =
      String(text || "").trim();

    if (!message) return;

    io.to(room).emit("chat", {
      name: socket.data.name || "زائر",
      text: message.slice(0, 500)
    });

  });


  // =========================
  // تحميل YouTube
  // =========================

  socket.on("youtube", (videoId) => {

    const room = socket.data.room;

    if (!room || !rooms.has(room)) return;

    const state = rooms.get(room);

    state.youtube =
      String(videoId || "").slice(0, 100);

    state.youtubeTime = 0;
    state.youtubePlaying = false;

    state.video = "";

    io.to(room).emit(
      "youtube",
      state.youtube
    );

  });


  // =========================
  // مزامنة YouTube
  // =========================

  socket.on("youtube-sync", (data) => {

    const room = socket.data.room;

    if (!room || !rooms.has(room)) return;

    const state = rooms.get(room);

    state.youtubeTime =
      Math.max(
        0,
        Number(data.time) || 0
      );

    state.youtubePlaying =
      !!data.playing;

    socket.to(room).emit(
      "youtube-sync",
      {
        time: state.youtubeTime,
        playing: state.youtubePlaying
      }
    );

  });


  // =========================
  // فيديو MP4
  // =========================

  socket.on("video", (url) => {

    const room = socket.data.room;

    if (!room || !rooms.has(room)) return;

    const state = rooms.get(room);

    state.video =
      String(url || "").slice(0, 2000);

    state.videoTime = 0;
    state.videoPlaying = false;

    state.youtube = "";

    io.to(room).emit(
      "video",
      state.video
    );

  });


  // =========================
  // مزامنة MP4
  // =========================

  socket.on("sync", (data) => {

    const room = socket.data.room;

    if (!room || !rooms.has(room)) return;

    const state = rooms.get(room);

    state.videoTime =
      Math.max(
        0,
        Number(data.time) || 0
      );

    state.videoPlaying =
      !!data.playing;

    socket.to(room).emit(
      "sync",
      {
        time: state.videoTime,
        playing: state.videoPlaying
      }
    );

  });


  // =========================
  // Netflix
  // =========================

  socket.on("netflix", (url) => {

    const room = socket.data.room;

    if (!room) return;

    const netflixUrl =
      String(
        url || "https://www.netflix.com/"
      ).slice(0, 2000);

    socket.to(room).emit(
      "netflix",
      netflixUrl
    );

  });


  // =========================
  // خروج
  // =========================

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