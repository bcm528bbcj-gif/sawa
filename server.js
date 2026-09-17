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

    room = room.toUpperCase();
    socket.join(room);
    socket.data.room = room;
    socket.data.name = name || "زائر";

    if (!rooms.has(room)) {
      rooms.set(room, {
        video: "",
        time: 0,
        playing: false
      });
    }

    const state = rooms.get(room);

    socket.emit("room-state", state);

    io.to(room).emit(
      "system",
      `${socket.data.name} دخل الغرفة`
    );
  });

  socket.on("video", (url) => {
    const room = socket.data.room;
    if (!room || !rooms.has(room)) return;

    const state = rooms.get(room);

    state.video = String(url || "").slice(0, 2000);
    state.time = 0;
    state.playing = false;

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

  socket.on("chat", (text) => {
    const room = socket.data.room;
    if (!room) return;

    io.to(room).emit("chat", {
      name: socket.data.name || "زائر",
      text: String(text || "").slice(0, 500)
    });
  });

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

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Razan running on port ${PORT}`);
});