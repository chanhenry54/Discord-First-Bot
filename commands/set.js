// Add summoner to database module
const Discord = require('discord.js');
const Summoner = require('../models/summonerSchema');

module.exports = {
    name: 'set',
    description: 'Sets/updates summoner for Discord user',
    usage: '!hechan set region summoner',
    run(client, message, args, kayn, REGIONS) {
        // parse region and summoner name
        if (args.length < 2) {
            return message.channel.send('Missing region and/or summoner name: !hechan set region summoner');
        }
        const region = args.shift().toLowerCase();
        if (!(Object.values(REGIONS).includes(region))) {
            return message.channel.send(`"${region}" is not a valid region. Valid regions are: ${Object.values(REGIONS).join(', ').toUpperCase()}`);
        }
        const summonerName = args.join(' ');

        kayn.Summoner.by.name(summonerName)
            .region(region)
            .then(summoner => {
                // set/update summoner for Discord user
                Summoner.findOne({ userID: message.author.id }, function (err, result) {
                    if (err) {
                        console.error(err);
                        return message.channel.send('Oops, an error has occurred! Please try again!');
                    }
                    if (!result) {
                        const newSummoner = new Summoner({
                            userID: message.author.id,
                            region: region,
                            summName: summoner.name,
                            accountID: summoner.accountId,
                            summID: summoner.id
                        });
                        newSummoner.save().catch(err => {
                            console.error(err);
                            return message.channel.send('Oops, an error has occurred! Please try again!');
                        });
                    } else {
                        result.region = region;
                        result.summName = summoner.name;
                        result.accountID = summoner.accountId;
                        result.summID = summoner.id;
                        result.save().catch(err => {
                            console.error(err);
                            return message.channel.send('Oops, an error has occurred! Please try again!');
                        })
                    }
                });

                // output message for when summoner is set
                const embed = new Discord.RichEmbed()
                    .setAuthor(`Summoner: ${summoner.name} [${region.toUpperCase()}]`, `https://opgg-static.akamaized.net/images/profile_icons/profileIcon${summoner.profileIconId}.jpg`)
                    .setColor(0x86DBC7)
                    .setDescription('This summoner is now linked to your user!');
                return message.channel.send(embed);
            })
            .catch(err => {
                console.error(err);
                return message.channel.send('Oops, an error occurred! Please try again!');
            });
    }
};