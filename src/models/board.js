const mongoose = require('mongoose');
const subSchema = mongoose.Schema({
    x: Number,
    y: Number,
    st: Number,
    cp: Number,
},{ _id : false });
const boardSchema = new mongoose.Schema(
    {
        room_id: {
            type: String,
            required: true,
        },
        game_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Game',
            required: true,
        },
        room_id: {
            type: String,
            required: true,
        },
        p1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        p2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        playerOnePos: [subSchema],
        playerTwoPos: [subSchema],
        diceStack: {
            type: Array
        },
        turnStack: {
            type: Array
        },
        playerOneCut: {
            type: Number
        },
        playerTwoCut: {
            type: Number
        },
        playerOneFirstDhayam: {
            type: Boolean
        },
        playerTwoFirstDhayam: {
            type: Boolean
        },
        playerTwoFirstDhayam: {
            type: Boolean
        },
        curPlayer: {
            type: String
        },
        selectTarget: {
            type: Array, default: [-1, -1]
        },
        newTarget: {
            type: Array, default: [-1, -1]
        },
        newInvalidTarget: {
            type: Array, default: [-1, -1]
        },
        moveStack: {
            type: Array, default: []
        },
        selectedCoin: {
            type: Number,
            default: -1
        },
        startMove: {
            type: Boolean
        },
        rollAgain: {
            type: Boolean
        },
    },
    { timestamps: true },
);
boardSchema.statics = {
    create: function (data, cb) {
        var board = new this(data);
        board.save(cb);
    },
};
module.exports = mongoose.model('Board', boardSchema);