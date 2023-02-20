const express = require("express");
const { createServer } = require("http");

const app = express();
const http = createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const chatRooms = () => {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = io;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push({ room: key });
    }
  });

  return publicRooms;
};

io.on("connection", (socket) => {
  io.sockets.emit("roomChange", chatRooms());
  socket.on("enterRoom", (room, user, id, toggleHandler) => {
    socket.join(room);
    toggleHandler();
    socket.to(room).emit("enter", user);
    io.sockets.emit("roomChange", chatRooms());
    socket.on("disconnecting", () => {
      socket.to(room).emit("exit", user);
    });
    socket.on("disconnect", () => {
      io.sockets.emit("roomChange", chatRooms());
    });
  });
  socket.on("message", (message) => {
    socket.to(message.room).emit("message", message);
  });
  socket.on("whisperMessage", (whisperId, whisperMessage) => {
    socket.to(whisperId).emit("message", whisperMessage);
  });
});

http.listen(3000, () => {
  console.log("서버 열림");
});
