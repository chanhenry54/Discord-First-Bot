// Check summoner profile module
const Discord = require('discord.js');
const Summoner = require('../models/summonerSchema');

module.exports = {
    name: 'profile',
    description: 'Shows the summoner profile for a particular user',
    usage: '!hechan profile [region] [summoner]',
    run(client, message, args, kayn, REGIONS) {
        let region;
        let summonerName;
        if (args.length > 0) { // if args are present
            if (args.length < 2) {
                return message.channel.send('Missing region and/or summoner name: !hechan profile [region] [summoner]');
            } else {
                region = args.shift().toLowerCase();
                if (!(Object.values(REGIONS).includes(region))) {
                    return message.channel.send(`"${region}" is not a valid region. Valid regions are: ${Object.values(REGIONS).join(', ').toUpperCase()}`);
                }
                summonerName = args.join(' ');
            }
        } else { // no args
            Summoner.findOne({ userID: message.author.id }, function (err, result) {
                if (err) {
                    console.error(err);
                    return message.channel.send('Oops, an error has occurred! Please try again!');
                }
                if (!result) {
                    return message.channel.send('Oops, you haven\'t set a summoner for your user yet: !hechan set region summoner');
                } else {
                    region = result.region;
                    summonerName = result.summName;
                }
            });
        }

        // get summoner data
        kayn.Summoner.by.name(summonerName)
            .region(region)
            .then(summoner => {
                // output profile
                const embed = new Discord.RichEmbed()
                    .setAuthor(`Summoner Profile: ${summonerName} [${region.toUpperCase()}]`)
                    .setThumbnail(`https://opgg-static.akamaized.net/images/profile_icons/profileIcon${summoner.profileIconId}.jpg`)
                    .setColor(0x86DBC7)
                    .setDescription(`Here is some information about ${summonerName} [${region.toUpperCase()}].`)
                    .addField('Level', summoner.summonerLevel, true);
                return message.channel.send(embed);
            })
            .catch(err => {
                console.error(err);
                return message.channel.send('Oops, an error occurred! Please try again!');
            });
    }
};