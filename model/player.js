const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Définition d'un schéma
const PlayerSchema = new Schema({
    role: String,
    num: String,
    name: String,
    surname: String
});

const Player = mongoose.model('Player', PlayerSchema);

module.exports = Player;
