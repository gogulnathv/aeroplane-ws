const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
const port = 3001; //port
io.on("connection", socket => {
  // socket.emit("test_connection", { socketId: socket.id });
  console.log("New Client connected", socket.id);
  socket.on("joinRoom", data => {
    var { roomId, userId, firstConnect } = data;
    socket.roomId = roomId;
    socket.userId = userId;
    var socketId = socket.id;
    console.log(socketId);

    socket.join(roomId);
    var clientsJoined = io.nsps["/"].adapter.rooms[roomId];
    var playerNum = clientsJoined.length;
    if (!firstConnect) {
      playerNum = 0;
    }
    io.sockets.connected[socketId].emit("playerNum", {
      data: playerNum,
      roomId: roomId
    });
    console.log(clientsJoined);
    // if (clients !== undefined)
    // }
    // socket.broadcast.to(socket.id).emit('playerNum', { data: clients });
    // io.sockets.socket(socket.id).emit('playerNum', { data: clients });
    // socket.to(socket.roomId).emit("test_connection", { roomId: socket.roomId });
  });
  socket.on("rollEmit", data => {
    var { roomId } = data;
    console.log(data);
    socket.to(roomId).emit("dice_roll", data);
  });
  socket.on("changePlayerEmit", data => {
    var { roomId } = data;
    socket.to(roomId).emit("change_player", data);
  });
  socket.on("coinEntry", data => {
    var { roomId } = data;
    socket.to(roomId).emit("coin_entry", data);
  });
  socket.on("validateMove", data => {
    var { roomId } = data;
    socket.to(roomId).emit("validate_move", data);
  });
  socket.on("moveCoin", data => {
    var { roomId } = data;
    var clients = io.nsps["/"].adapter.rooms[roomId];
    Object.keys(clients.sockets).forEach(el => {
      if (el !== socket.id) {
        // console.log(el);
        // console.log(socket.id);
        io.to(el).emit("move_coin", data);
      }
    });
    socket.to(roomId).emit("move_coin", data);
  });
  socket.on("undoMove", data => {
    var { roomId } = data;
    socket.to(roomId).emit("undo_move", data);
  });
  socket.on("transferMove", data => {
    var { roomId } = data;
    socket.to(roomId).emit("transfer_move", data);
  });
});
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.get("/", (req, res) => {
  res.send("Hello world!!");
  // return 'Hello';
});
server.listen(port, () => console.log(`Server listening on port ${port}!`));
