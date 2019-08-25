// Add summoner to database module
const Discord = require('discord.js');
const Summoner = require('../models/summonerSchema');

module.exports = {
    name: 'setSummoner',
    description: 'Sets summoner for Discord user',
    usage: '[region] [summoner name]',
    run(client, message, args, kayn, REGIONS) {
        // parse region and summoner name
        if (args.length < 2) {
            return message.channel.send('Missing region and/or summoner name');
        }
        const region = args.shift().toLowerCase();
        if (!(Object.values(REGIONS).includes(region))) {
            return message.channel.send(`${region} is not a valid region. Valid regions are: ${Object.values(REGIONS).join(', ').toUpperCase()}`);
        }
        summonerName = args.join(' ');

        kayn.Summoner.by.name(summonerName)
            .region(region)
            .then(summoner => {
                const embed = new Discord.RichEmbed()
                    .setAuthor(`Summoner: ${summoner.name} [${region.toUpperCase()}]`, `https://opgg-static.akamaized.net/images/profile_icons/profileIcon${summoner.profileIconId}.jpg`)
                    .setColor(0x86DBC7)
                    .setDescription('This summoner is now linked to your user account!');
                return message.channel.send(embed);
            })
            .catch(err => {
                console.error(err);
            });
    }
};