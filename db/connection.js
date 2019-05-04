const mongoose = require('mongoose');

var connection = mongoose.connect('mongodb://localhost:27017/football_info', {useNewUrlParser: true});

module.exports = {
    connection
};