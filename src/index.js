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
    let { room_id } = req.query;
    var result = boardModel.find({ room_id }).populate('user').exec(function (error, posts) {
      res.send(JSON.stringify(posts, null, "\t"));
    })

    // return 'Hello';
  });
  app.get("/pending_game", (req, res) => {
    let { userId } = req.query;
    gameModel.find({ $or: [{ creator: userId }, { opponent: userId }], gameStarted: 1 }).populate(['creator', 'opponent']).sort('-createdAt').exec(function (error, games) {
      console.log(error);
      // console.log(games);
      let result = [];
      games.forEach((game) => {
        console.log(game);
        let opponent;
        if (game.creator && game.creator._id == userId) {
          opponent = game.opponent.username;
        } else if (game.opponent && game.opponent._id == userId) {
          opponent = game.creator.username;
        }
        result.push({
          gameId: game._id,
          roomId: game.room_id,
          opponent,
          created: game.createdAt,
          selected: false
        })
      })
      res.json(result);
    })
  });
  app.get("/joinedCheck", (req, res) => {
    let { room_id } = req.query;
    if (room_id)
      gameModel.findOne({ room_id: room_id, gameStarted: 1 }, (err, gameData) => {
        if (err) throw err;
        if (gameData) {
          res.json({
            oppJoined: true,
          })
        } else {
          res.json({ oppJoined: false })
        }
      })
  });

  app.post("/registerCheck", (req, res) => {
    let { userId } = req.body;
    console.log(userId);
    userModel.findOne({ _id: userId }, (err, data) => {
      console.log(err);
      console.log(data);

      if (err) throw err;
      if (data) {
        res.json({
          registered: true
        })
      } else {
        res.json({
          registered: false
        })
      }
    })
  });

  app.post('/register', (req, res) => {
    let { username, platform, os_ver } = req.body;
    userModel.create({ username }, function (err, user) {
      console.log(err);
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
    function getNumber(callback) {
      var n = Math.floor(10000000 + Math.random() * 90000000);
      gameModel.findOne({ 'room_id': n }, function (err, result) {
        if (err) callback(err);
        else if (result) return getNumber(callback);
        else callback(null, n);
      });
    }


    socket.on("createRoom", async (data) => {
      let { userId, deviceId, gameVer, bet } = data;
      let existingRoom = await gameModel.findOne({ creator: userId, gameStarted: 0 });
      if (existingRoom) {
        // console.log();
        let { room_id, gameVersion } = existingRoom;
        socket.join(room_id);
        socket.emit("playerNum", {
          data: 1,
          roomId: room_id,
          gameVersion
        });
      } else {
        getNumber(function (error, number) {
          console.log(number);

          let room_id = number;//Math.floor(10000000 + Math.random() * 90000000);
          let gameVersion = gameVer;

          let gameData = {
            room_id,
            users: [userId],
            bet,
            GamePot: bet,
            gameStarted: 0,
            gameVersion,
            creator: userId
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
      }
    });
    socket.on("joinRoom2", data => {
      let { roomId, userId } = data;
      gameModel.findOne({ room_id: roomId }, (err, data) => {
        if (err) throw err;
        if (data) {
          let bet = data.bet;
          let gameVersion = data.gameVersion;
          let iAm = userId == data.p1 ? 'P1' : 'P2'
          let gameId = data._id;
          console.log(data.users.indexOf(userId));
          if (data.users.indexOf(userId) >= 0) {
            socket.join(roomId);
            socket.emit('gameStart', { gameVersion, iAm, roomId, continueGame: true });
          } else if (data.users.length < 2) {
            let users = [...data.users, userId];

            gameModel.findOneAndUpdate({ room_id: roomId }, { users: users, gameStarted: 1, opponent: userId }, { new: true }, (err, data) => { });

            boardModel.findOneAndUpdate({ room_id: roomId }, { p2: userId }, { new: true }, (err, data) => {
              if (err) throw err;
              statModel.updateMany(
                { $or: [{ user: data.p1 }, { user: data.p2 }] },
                { $inc: { 'totalCoins': -bet } });
              users.forEach((user) => {
                statModel.findOneAndUpdate({ user: user }, { $push: { gamesInProgress: gameId } }, { new: true }, (err, userCB) => { })
              })
            });
            socket.join(roomId);
            socket.emit("playerNum", {
              data: 2,
              roomId: roomId,
              gameVersion
            });
            socket.to(roomId).emit('gameStart', { continueGame: false });
          } else {
            //ToDO: Roomful
          }
        }
      })

    });
    socket.on("gameOver", data => {
      let { userId } = data;
      gameModel.findOneAndUpdate({ room_id: roomId }, { winner: userId, gameStarted: 2 }, { new: true }, (err, gameData) => {
        let coinsWon = gameData.GamePot;
        statModel.findOneAndUpdate({ user: userId }, { $inc: { 'totalCoins': +coinsWon } }, { new: true }, (err, statData) => { });
      });
    })
    socket.on("syncMe", data => {
      console.log("syncMe")
      let { roomId } = data;
      console.log("syncMe", data)
      boardModel.findOne({ room_id: roomId }, (err, gameData) => {
        console.log(gameData);
        socket.emit('sync', gameData);
      });
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
      boardModel.findOneAndUpdate({ room_id: roomId }, { diceStack, startMove, rollAgain }, { new: true }, (err, roll) => {
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
      boardModel.findOneAndUpdate({ room_id: roomId }, gameData, { new: true }, (err, change) => {

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
      boardModel.findOneAndUpdate({ room_id: roomId }, gameData, { new: true }, (err, validate) => {
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
      boardModel.findOneAndUpdate({ room_id: roomId }, gameData, { new: true }, (err, movCoin) => {

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
      boardModel.findOneAndUpdate({ room_id: roomId }, gameData, { new: true }, (err, undoMove) => {

      });
      socket.to(roomId).emit("undo_move", { 'emit': emit, 'roomId': roomId });
    });
    socket.on("transferMove", data => {
      let { roomId } = data;
      socket.to(roomId).emit("transfer_move", data);
    });
  });

  server.listen(port, () => console.log(`Server listening on port ${port}!`));
}).catch((e) => {
  console.log("No connection to DB");
});