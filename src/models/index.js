const mongoose = require('mongoose');

// import User from 'user';

const connectDb = () => {
  // gogul - G0gu1Nath
  return mongoose.connect('mongodb://goguldk:G0gu1_dk@127.0.0.1:27017/dk',
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
