const mongoose = require('mongoose');

const statisticSchema = new mongoose.Schema(
    {
        gamesPlayed: {
            type: Number,
            default: 0
        },
        gamesWon: {
            type: Number,
            default: 0
        },
        gamesLost: {
            type: Number,
            default: 0
        },
        gamesAbandoned: {
            type: Number,
            default: 0
        },
        totalCaptured: {
            type: Number,
            default: 0
        },
        totalGiven: {
            type: Number,
            default: 0
        },
        singleHighestRoll: {
            type: Number,
            default: 0
        },
        totalFullEntry: {
            type: Number,
            default: 0
        },
        totalCoins: {
            type: Number
        },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true },
);
statisticSchema.statics = {
    create: function (data, cb) {
        var statistic = new this(data);
        statistic.save(cb);
    },

    get: function (query, cb) {
        this.find(query, cb);
    },

    getByName: function (query, cb) {
        this.find(query, cb);
    },

    update: function (query, updateData, cb) {
        this.findOneAndUpdate(query, { $set: updateData }, { new: true }, cb);
    },

    delete: function (query, cb) {
        this.findOneAndDelete(query, cb);
    }
}

module.exports = mongoose.model('Statistic', statisticSchema);

// export default Statistic;