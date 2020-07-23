const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
    {
        platform: {
            type: String,
            required: true,
        },
        os_ver: {
            type: String,
            required: true,
        },
        user:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    { timestamps: true },
);
deviceSchema.statics = {
    create : function(data, cb) {
        var device = new this(data);
        device.save(cb);
    },

    get: function(query, cb) {
        this.find(query, cb);
    },

    getByName: function(query, cb) {
        this.find(query, cb);
    },

    update: function(query, updateData, cb) {
        this.findOneAndUpdate(query, {$set: updateData},{new: true}, cb);
    },

    delete: function(query, cb) {
        this.findOneAndDelete(query,cb);
    }
}

module.exports = mongoose.model('Device', deviceSchema);

// export default Device;