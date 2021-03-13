const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});

// /Users/almoggutin/mongodb/bin/mongod --dbpath=/Users/almoggutin/mongodb-data
