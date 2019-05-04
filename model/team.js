const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Définition d'un schéma
const TeamSchema = new Schema({
    teamId: String,
    name: String,
    country: String,
    players: {type: mongoose.Schema.Types.ObjectId, ref: 'Player'},
    logo: String
});

const Team = mongoose.model('Team', TeamSchema);

module.exports = Team;
