const mongoose = require('mongoose');

// import User from 'user';

const connectDb = () => {
  return mongoose.connect('mongodb://localhost:27017/dk',
    {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true
    });
};

// const models = { User };

module.exports = connectDb;

// export default models;