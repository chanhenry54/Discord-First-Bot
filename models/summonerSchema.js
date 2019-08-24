// Summoner model
const mongoose = require('mongoose');

const summonerSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userID: String,
    region: String,
    summName: String
});

module.exports = mongoose.model('Summoner', summonerSchema);