const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
const fs = require('fs');
const port = 3001; //port
const playerOneInit = [
  { 'x': 14, 'y': 1, 'status': 0, 'curPos': -1 },
  { 'x': 14, 'y': 2, 'status': 0, 'curPos': -1 },
  { 'x': 14, 'y': 3, 'status': 0, 'curPos': -1 },
  { 'x': 14, 'y': 4, 'status': 0, 'curPos': -1 },
  { 'x': 15, 'y': 1, 'status': 0, 'curPos': -1 },
  { 'x': 15, 'y': 2, 'status': 0, 'curPos': -1 },
  { 'x': 15, 'y': 3, 'status': 0, 'curPos': -1 },
  { 'x': 15, 'y': 4, 'status': 0, 'curPos': -1 },
  { 'x': 16, 'y': 1, 'status': 0, 'curPos': -1 },
  { 'x': 16, 'y': 2, 'status': 0, 'curPos': -1 },
  { 'x': 16, 'y': 3, 'status': 0, 'curPos': -1 },
  { 'x': 16, 'y': 4, 'status': 0, 'curPos': -1 }
];
const playerTwoInit = [
  { 'x': 14, 'y': 8, 'status': 0, 'curPos': -1 },
  // {'x': 11, 'y': 7, 'status': 1, 'curPos': 60},
  { 'x': 14, 'y': 9, 'status': 0, 'curPos': -1 },
  { 'x': 14, 'y': 10, 'status': 0, 'curPos': -1 },
  { 'x': 14, 'y': 11, 'status': 0, 'curPos': -1 },
  { 'x': 15, 'y': 8, 'status': 0, 'curPos': -1 },
  { 'x': 15, 'y': 9, 'status': 0, 'curPos': -1 },
  { 'x': 15, 'y': 10, 'status': 0, 'curPos': -1 },
  { 'x': 15, 'y': 11, 'status': 0, 'curPos': -1 },
  { 'x': 16, 'y': 8, 'status': 0, 'curPos': -1 },
  { 'x': 16, 'y': 9, 'status': 0, 'curPos': -1 },
  { 'x': 16, 'y': 10, 'status': 0, 'curPos': -1 },
  { 'x': 16, 'y': 11, 'status': 0, 'curPos': -1 },
];
io.on("connection", socket => {
  // socket.emit("test_connection", { socketId: socket.id });
  console.log("New Client connected", socket.id);
  socket.on("joinRoom", data => {
    var { roomId, userId, firstConnect, gameVersion, active } = data;
    socket.roomId = roomId;
    socket.userId = userId;
    var socketId = socket.id;
    console.log(socketId);
    if (!firstConnect) {
      let gameData = [];
      const game_data = fs.readFileSync(`public/${roomId}.json`);
      gameData = JSON.parse(game_data);
      if (active) {
        console.log('active');
        socket.emit('sync', gameData);
        socket.to(roomId).emit('sync', gameData);
      } else {
        console.log('passive');
        socket.emit('sync', gameData);
      }
    }
    socket.join(roomId);
    var clientsJoined = io.nsps["/"].adapter.rooms[roomId];
    var playerNum = clientsJoined.length;
    if (!firstConnect) {
      playerNum = 0;
    }
    if (firstConnect && playerNum == 1) {
      let playerOnePos = playerOneInit.slice(0, gameVersion);
      let playerTwoPos = playerTwoInit.slice(0, gameVersion);
      let diceStack = [];
      let turnStack = [];
      let playerOneCut = 0;
      let playerTwoCut = 0;
      let playerOneFirstDhayam = false;
      let playerTwoFirstDhayam = false;
      let curPlayer = 'P1';
      let gameData = {
        playerOnePos, playerTwoPos, diceStack, turnStack, playerOneCut, playerTwoCut, curPlayer, playerOneFirstDhayam, playerTwoFirstDhayam
      }


      fs.writeFile(`public/${roomId}.json`, JSON.stringify(gameData), (err) => {
        if (err) throw err;
        console.log('Data written to file');
      });
      // let student = JSON.parse(rawdata);
      // console.log(student);
    }
    socket.emit("playerNum", {
      data: playerNum,
      roomId: roomId
    });
    console.log(clientsJoined);
  });
  socket.on('pingSent', data => {
    console.log('ping');
    socket.emit('pingRes');
  });
  socket.on("rollEmit", data => {
    var { roomId } = data;
    //Store to File
    fs.readFile(`public/${roomId}.json`, (err, game_data) => {
      if (err) throw err;
      let gameData = JSON.parse(game_data);
      gameData['diceStack'] = data['diceStack'];
      fs.writeFile(`public/${roomId}.json`, JSON.stringify(gameData), (err) => {
        if (err) throw err;
        console.log('Data written to file');
      })
    });
    //Store to File
    socket.to(roomId).emit("dice_roll", data);
  });
  socket.on("changePlayerEmit", data => {
    var { roomId } = data;
    //Store to File
    fs.readFile(`public/${roomId}.json`, (err, game_data) => {
      if (err) throw err;
      let gameData = JSON.parse(game_data);
      gameData['curPlayer'] = data['curPlayer'];
      fs.writeFile(`public/${roomId}.json`, JSON.stringify(gameData), (err) => {
        if (err) throw err;
        console.log('Data written to file');
      })
    });
    //Store to File
    socket.to(roomId).emit("change_player", data);
  });
  socket.on("coinEntry", data => {
    var { roomId, diceStack, playerPos, firstDhayam, emit } = data;
    let pOnePos, p
    //Store to File
    fs.readFile(`public/${roomId}.json`, (err, game_data) => {
      if (err) throw err;
      let gameData = JSON.parse(game_data);
      if (emit == 'P1') {
        gameData['playerOnePos'] = playerPos;
        gameData['playerOneFirstDhayam'] = firstDhayam;
      } else {
        gameData['playerTwoPos'] = playerPos;
        gameData['playerTwoFirstDhayam'] = firstDhayam;
      }
      gameData['diceStack'] = diceStack;
      fs.writeFile(`public/${roomId}.json`, JSON.stringify(gameData), (err) => {
        if (err) throw err;
        console.log('Data written to file');
      })
    });
    //Store to File
    socket.to(roomId).emit("coin_entry", data);
  });
  socket.on("validateMove", data => {
    var { roomId, selectedCoin, diceStack, moveStack, selectTarget, newTarget, newInvalidTarget, emit } = data;
    //Store to File
    fs.readFile(`public/${roomId}.json`, (err, game_data) => {
      if (err) throw err;
      let gameData = JSON.parse(game_data);
      gameData['selectedCoin'] = selectedCoin;
      gameData['diceStack'] = diceStack;
      gameData['moveStack'] = moveStack;
      gameData['selectTarget'] = selectTarget;
      gameData['newTarget'] = newTarget;
      gameData['newInvalidTarget'] = newInvalidTarget;
      fs.writeFile(`public/${roomId}.json`, JSON.stringify(gameData), (err) => {
        if (err) throw err;
        console.log('Data written to file');
      })
    });
    //Store to File
    socket.to(roomId).emit("validate_move", data);
  });
  socket.on("moveCoin", data => {
    var { roomId, coinCutStatus, iAmPos, oppPos, selectedCoin, diceStack, moveStack, turnStack, selectTarget, newTarget, emit, playerOneCut, playerTwoCut } = data;
    console.log('Move Coin', data);
    //Store to File
    fs.readFile(`public/${roomId}.json`, (err, game_data) => {
      if (err) throw err;
      let gameData = JSON.parse(game_data);
      console.log(iAmPos);
      if (emit == 'P1') {
        gameData['playerOnePos'] = iAmPos;
        if (coinCutStatus) gameData['playerTwoPos'] = oppPos;
      } else {
        gameData['playerTwoPos'] = iAmPos;
        if (coinCutStatus) gameData['playerOnePos'] = oppPos;
      }

      gameData['selectedCoin'] = selectedCoin;
      gameData['playerOneCut'] = playerOneCut;
      gameData['playerTwoCut'] = playerTwoCut;
      gameData['diceStack'] = diceStack;
      gameData['moveStack'] = moveStack;
      gameData['turnStack'] = turnStack;
      gameData['selectTarget'] = selectTarget;
      gameData['newTarget'] = newTarget;
      fs.writeFile(`public/${roomId}.json`, JSON.stringify(gameData), (err) => {
        if (err) throw err;
        console.log('Data written to file');
      })
    });
    //Store to File
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
app.use(function (req, res, next) {
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
