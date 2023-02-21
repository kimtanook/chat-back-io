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
  const publicRooms = [
    { room: "제주전체" },
    { room: "제주시" },
    { room: "서귀포시" },
  ];

  rooms.forEach((value, key) => {
    if (
      sids.get(key) === undefined &&
      !publicRooms.some((item) => item.room === key)
    ) {
      publicRooms.push({ room: key });
    }
  });

  return publicRooms;
};
const users = [];
const chatUser = ({ user, id, deleteId }) => {
  if (users.some((item) => item.id === deleteId)) {
    users.forEach((item, index) => {
      if (item.id === deleteId) {
        users.splice(index, 1);
      }
    });
  } else {
    users.push({
      user,
      id,
    });
  }
  return users;
};
const countRoomUser = (room) => {
  const count = io.sockets.adapter.rooms.get(room)?.size;

  return count;
};
io.on("connection", (socket) => {
  io.sockets.emit("roomChange", chatRooms());
  socket.on("enterRoom", (room, user, id, toggleHandler) => {
    socket["nickname"] = user;
    socket.join(room);
    toggleHandler();
    socket.to(room).emit("enter", socket.nickname, countRoomUser(room));
    io.sockets.emit("roomChange", chatRooms(), chatUser({ user, id }));
    socket.on("disconnecting", () => {
      socket.to(room).emit("exit", socket.nickname);
    });
    socket.on("disconnect", () => {
      io.sockets.emit(
        "roomChange",
        chatRooms(),
        chatUser({ user, id, deleteId: id })
      );
    });
  });

  socket.on("message", (message) => {
    socket.to(message.room).emit("message", message);
  });
  socket.on("whisperMessage", (whisperId, whisperMessage) => {
    socket.to(whisperId).emit("message", whisperMessage);
  });
  socket.on("leaveRoom", (room, deleteId) => {
    socket.leave(room);
    socket.to(room).emit("exit", socket.nickname, countRoomUser(room));
    io.sockets.emit("roomChange", chatRooms(), chatUser({ deleteId }));
  });
});

http.listen(3000, () => {
  console.log("서버 열림");
});
