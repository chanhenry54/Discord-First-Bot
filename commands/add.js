// Add summoner to database module
const Summoner = require('../models/summonerSchema');
const REGIONS = {
    'ru': 'ru',
    'kr': 'kr',
    'br': 'br1',
    'oce': 'oc1',
    'jp': 'jp1',
    'na': 'na1',
    'eune': 'eun1',
    'euw': 'euw1',
    'tr': 'tr1'
};

module.exports = {
    name: 'add',
    description: 'Adds summoner to Discord user',
    usage: '[region] [summoner name]',
    run(client, message, args) {
        if (args.length < 2) {
            return message.channel.send('Missing region and/or summoner name');
        }
        const region = args.shift().toLowerCase();
        if (!REGIONS.hasOwnProperty(region)) {
            return message.channel.send(`${region} is not a valid region. Valid regions are: ${Object.keys(REGIONS).join(', ')}`);
        }
        summonerName = args.join('');
        return message.channel.send(summonerName); // temp to check if works
    }
};