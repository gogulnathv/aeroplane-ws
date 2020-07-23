const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
    {
        room_id: {
            type: String,
            required: true,
        },
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
        bet: {
            type: Number,
            required: true
        },
        GamePot: {
            type: Number,
            required: true
        },
        gameVersion: {
            type: Number,
            required: true
        },
        gameStarted: {
            type: Boolean,
            required: true
        },

    },
    { timestamps: true },
);
gameSchema.statics = {
    create : function(data, cb) {
        var game = new this(data);
        game.save(cb);
    },
};
module.exports = mongoose.model('Game', gameSchema);