const mongoose = require('mongoose');

const statisticSchema = new mongoose.Schema(
    {
        totalGames: {
            type: Number
        },
        totalWin: {
            type: Number
        },
        totalCaptured: {
            type: Number
        },
        totalGiven: {
            type: Number
        },
        singleHighestRoll: {
            type: Number
        },
        totalFullEntry: {
            type: Number
        },
        totalCoins: {
            type: Number
        },
        gamesInProgress:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Game',
        }],
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