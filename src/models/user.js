const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            // unique: true,
            required: true,
        },
        email: {
            type: String,
            // unique: true,
        }
    },
    { timestamps: true },
);
userSchema.statics = {
    create : function(data, cb) {
        var user = new this(data);
        user.save(cb);
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

module.exports = mongoose.model('User', userSchema);

// export default User;