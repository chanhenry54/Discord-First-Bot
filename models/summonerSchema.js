// Summoner model
const mongoose = require('mongoose');

const summonerSchema = mongoose.Schema({
    userID: String,
    region: String,
    summName: String,
    accountID: String,
    summID: String
});

module.exports = mongoose.model('Summoner', summonerSchema);