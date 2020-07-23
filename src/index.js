const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require('mongoose');
const server = http.createServer(app);
const io = require("socket.io").listen(server, {
  pingTimeout: 1000,
  pingInterval: 1000,
});
const fs = require('fs');
const port = 3001; //port
const connectDb = require('./models');
const userModel = require('./models/user');
const statModel = require('./models/statistic');
const deviceModel = require('./models/device');
const boardModel = require('./models/board');
const gameModel = require('./models/game');
// connectDb().then(async () => {});
connectDb().then(async (db) => {
  

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // app.use(function (req, res, next) {
  //   res.header("Access-Control-Allow-Origin", "*");
  //   res.header(
  //     "Access-Control-Allow-Headers",
  //     "Origin, X-Requested-With, Content-Type, Accept"
  //   );
  //   next();
  // });
  app.get("/", (req, res) => {
    let {room_id}=req.query;
    var result = boardModel.find({room_id}).populate('user').exec(function (error, posts) {
      res.send(JSON.stringify(posts, null, "\t"));
    })

    // return 'Hello';
  });
  app.post('/register', (req, res) => {
    let { username, platform, os_ver } = req.body;
    userModel.create({ username }, function (err, user) {
      if (err) {
        if (err.code === 11000 || err.code === 11001) {
          res.json({
            error: { code: err.code, message: 'DuplicateGuestId' }
          })
        } else {
          res.json({
            error: { code: 500, message: 'Something went Wrong' }
          })
        }

      } else {
        let userId = user._id;
        let statsData = {
          totalCoins: 10000,
          user: userId
        };
        statModel.create(statsData, function (err, stat) { });
        deviceModel.create({ platform, os_ver, user: userId }, function (err, device) {
          res.json({
            userId,
            deviceId: device._id
          })
        })
      }

    });

  });

  const playerOneInit = [
    { 'x': 14, 'y': 1, 'st': 0, 'cp': -1 },
    { 'x': 14, 'y': 2, 'st': 0, 'cp': -1 },
    { 'x': 14, 'y': 3, 'st': 0, 'cp': -1 },
    { 'x': 14, 'y': 4, 'st': 0, 'cp': -1 },
    { 'x': 15, 'y': 1, 'st': 0, 'cp': -1 },
    { 'x': 15, 'y': 2, 'st': 0, 'cp': -1 },
    { 'x': 15, 'y': 3, 'st': 0, 'cp': -1 },
    { 'x': 15, 'y': 4, 'st': 0, 'cp': -1 },
    { 'x': 16, 'y': 1, 'st': 0, 'cp': -1 },
    { 'x': 16, 'y': 2, 'st': 0, 'cp': -1 },
    { 'x': 16, 'y': 3, 'st': 0, 'cp': -1 },
    { 'x': 16, 'y': 4, 'st': 0, 'cp': -1 }
  ];
  const playerTwoInit = [
    { 'x': 14, 'y': 8, 'st': 0, 'cp': -1 },
    // {'x': 11, 'y': 7, 'st': 1, 'cp': 60},
    { 'x': 14, 'y': 9, 'st': 0, 'cp': -1 },
    { 'x': 14, 'y': 10, 'st': 0, 'cp': -1 },
    { 'x': 14, 'y': 11, 'st': 0, 'cp': -1 },
    { 'x': 15, 'y': 8, 'st': 0, 'cp': -1 },
    { 'x': 15, 'y': 9, 'st': 0, 'cp': -1 },
    { 'x': 15, 'y': 10, 'st': 0, 'cp': -1 },
    { 'x': 15, 'y': 11, 'st': 0, 'cp': -1 },
    { 'x': 16, 'y': 8, 'st': 0, 'cp': -1 },
    { 'x': 16, 'y': 9, 'st': 0, 'cp': -1 },
    { 'x': 16, 'y': 10, 'st': 0, 'cp': -1 },
    { 'x': 16, 'y': 11, 'st': 0, 'cp': -1 },
  ];
  io.on("connection", socket => {
    console.log("New Client connected", socket.id);
    socket.on('disconnect', data => {
      socket.leave(socket.roomId);
      socket.to(socket.roomId).emit('opp_disconnect');
    });
    socket.on("createRoom", data => {
      let { userId, deviceId, gameVer, bet } = data;
      let room_id = Math.floor(10000000 + Math.random() * 90000000);
      let gameVersion = gameVer;

      let gameData = {
        room_id,
        users: [userId],
        bet,
        GamePot: bet,
        gameStarted: false,
        gameVersion
      }
      gameModel.create(gameData, (err, game) => {
        let playerOnePos = playerOneInit.slice(0, gameVersion);
        let playerTwoPos = playerTwoInit.slice(0, gameVersion);
        let diceStack = [];
        let turnStack = [];
        let playerOneCut = 0;
        let playerTwoCut = 0;
        let playerOneFirstDhayam = false;
        let playerTwoFirstDhayam = false;
        let curPlayer = 'P1';
        let selectTarget = [-1, -1];
        let newTarget = [-1, -1];
        let newInvalidTarget = [-1, -1];
        let moveStack = [];
        let selectedCoin = -1;
        let startMove = false;
        let rollAgain = false;

        let boardData = {
          room_id,
          playerOnePos,
          playerTwoPos,
          diceStack,
          turnStack,
          playerOneCut,
          playerTwoCut,
          curPlayer,
          playerOneFirstDhayam,
          playerTwoFirstDhayam,
          selectTarget,
          newTarget,
          newInvalidTarget,
          moveStack,
          selectedCoin,
          startMove,
          rollAgain,
          p1: userId,
          game_id: game._id
        }
        boardModel.create(boardData, (err, board) => {
          socket.join(room_id);
          socket.emit("playerNum", {
            data: 1,
            roomId: room_id,
            gameVersion
          });
        });
      });
    });
    socket.on("joinRoom2", data => {
      let { roomId, userId } = data;
      gameModel.findOne({ room_id: roomId }, (err, data) => {
        if (err) throw err;
        let bet = data.bet;
        let gameVersion = data.gameVersion;
        if (data) {
          if (data.users.length < 2) {
            let users = [...data.users, userId];
            gameModel.findOneAndUpdate({ room_id: roomId }, { users: users });

            boardModel.findOneAndUpdate({ room_id: roomId }, { p2: userId }, { new: true }, (err, data) => {
              if (err) throw err;
              statModel.updateMany(
                { $or: [{ user: data.p1 }, { user: data.p2 }] },
                { $inc: { 'totalCoins': -bet } });
            });
            socket.join(roomId);
            socket.emit("playerNum", {
              data: 2,
              roomId: roomId,
              gameVersion
            });
            socket.to(roomId).emit('gameStart');
          } else {
            //ToDO: Roomful
          }
        }
      })

    });
    socket.on("joinRoom", data => {
      let { roomId, userId, firstConnect, gameVersion, active } = data;
      socket.roomId = roomId;
      socket.userId = userId;
      let socketId = socket.id;
      if (!firstConnect) {
        boardModel.findOne({ room_id: roomId }, (err, gameData) => {
          if (active) {
            socket.emit('sync', gameData);
            socket.to(roomId).emit('sync', gameData);
          } else {
            socket.emit('sync', gameData);
          }
        });
        socket.to(roomId).emit('opp_reconnect');
      }
      socket.join(roomId);
    });
    socket.on('pingSent', (data, callback) => {
      console.log('ping');
      callback({ 'OK': true });
      // socket.emit('pingRes');
    });
    socket.on("rollEmit", data => {
      let { roomId, diceStack, startMove, rollAgain } = data;
      boardModel.findOneAndUpdate({ room_id: roomId }, { diceStack, startMove, rollAgain },{new:true},(err,roll)=>{
      });
      socket.to(roomId).emit("dice_roll", data);
    });
    socket.on("changePlayerEmit", data => {
      let { roomId, curPlayer } = data;
      let gameData = {};
      gameData['curPlayer'] = curPlayer;
      gameData['diceStack'] = [];
      gameData['turnStack'] = [];
      gameData['newTarget'] = [-1, -1];
      gameData['newInvalidTarget'] = [-1, -1];
      gameData['selectTarget'] = [-1, -1];
      gameData['startMove'] = false;
      gameData['rollAgain'] = false;
      boardModel.findOneAndUpdate({ room_id: roomId }, gameData,{new:true},(err,change)=>{
        
      });
      socket.to(roomId).emit("change_player", data);
    });
    socket.on("coinEntry", data => {
      let { roomId, diceStack, playerPos, firstDhayam, emit } = data;
      let gameData = {};
      if (emit == 'P1') {
        gameData['playerOnePos'] = playerPos;
        gameData['playerOneFirstDhayam'] = firstDhayam;
      } else {
        gameData['playerTwoPos'] = playerPos;
        gameData['playerTwoFirstDhayam'] = firstDhayam;
      }
      gameData['diceStack'] = diceStack;
      boardModel.findOneAndUpdate({ room_id: roomId }, gameData);
      socket.to(roomId).emit("coin_entry", data);
    });
    socket.on("validateMove", data => {
      let { roomId, selectedCoin, diceStack, moveStack, selectTarget, newTarget, newInvalidTarget, emit } = data;
      let gameData = {};
      gameData['selectedCoin'] = selectedCoin;
      gameData['diceStack'] = diceStack;
      gameData['moveStack'] = moveStack;
      gameData['selectTarget'] = selectTarget;
      gameData['newTarget'] = newTarget;
      gameData['newInvalidTarget'] = newInvalidTarget;
      boardModel.findOneAndUpdate({ room_id: roomId }, gameData,{new:true},(err,validate)=>{
      });
      socket.to(roomId).emit("validate_move", data);
    });
    socket.on("moveCoin", data => {
      let { roomId, coinCutStatus, iAmPos, oppPos, selectedCoin, diceStack, moveStack, turnStack, selectTarget, newTarget, emit, playerOneCut, playerTwoCut } = data;
      let gameData = {};
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
      gameData['moveStack'] = [];
      gameData['turnStack'] = turnStack;
      gameData['selectTarget'] = [-1, -1];
      gameData['newTarget'] = [-1, -1];
      gameData['selectedCoin'] = -1;
      boardModel.findOneAndUpdate({ room_id: roomId }, gameData,{new:true},(err,movCoin)=>{
        
      });
      socket.to(roomId).emit("move_coin", {
        'selectedCoin': selectedCoin,
        'moveStack': moveStack,
        'newTarget': newTarget,
        'selectTarget': selectTarget,
        'emit': emit
      });
    });
    socket.on("undoMove", data => {
      let { roomId, coinCutStatus, iAmPos, oppPos, selectedCoin, diceStack, moveStack, turnStack, selectTarget, newTarget, emit, playerOneCut, playerTwoCut } = data;
      let gameData = {};
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
      boardModel.findOneAndUpdate({ room_id: roomId }, gameData,{new:true},(err,undoMove)=>{
        
      });
      socket.to(roomId).emit("undo_move", { 'emit': emit, 'roomId': roomId });
    });
    socket.on("transferMove", data => {
      let { roomId } = data;
      socket.to(roomId).emit("transfer_move", data);
    });
  });

  server.listen(port, () => console.log(`Server listening on port ${port}!`));
});
