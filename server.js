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

io.on("connection", (socket) => {
  socket.on("room_enter", (roomName, nickname, showRoom) => {
    socket.join(roomName);
    // 프론트에서 받은 아래 함수는 백에서 실행시키지 않고, 프론트의 실행 버튼을 대신 눌러준다고 생각하면 편하다.
    showRoom();
    socket.to(roomName).emit("welcome", nickname);
    socket.on("disconnecting", () => {
      socket.to(roomName).emit("bye", nickname);
    });
  });
  socket.on("message", (roomName, nickname, message) => {
    socket.to(roomName).emit("message", nickname, message);
  });
});

http.listen(8080, () => {
  console.log("서버가 요청을 받을 준비가 됐어요");
});
