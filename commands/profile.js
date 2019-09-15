// Check summoner profile module
const Discord = require('discord.js');
const Summoner = require('../models/summonerSchema');

const queues = {
    400: 'SR Draft',
    420: 'Ranked Solo/Duo',
    430: 'SR Normal',
    440: 'Ranked Flex',
    450: 'ARAM',
    830: 'Intro Bots',
    840: 'Beginner Bots',
    850: 'Intermediate Bots'
};

// helper function to process match data
const processMatch = (championIdMap, summonerId, match) => {
    const { participantId } = match.participantIdentities.find(pi => pi.player.summonerId === summonerId);
    const participant = match.participants.find(p => p.participantId === participantId);
    const champion = championIdMap.data[participant.championId];
    return {
        gameCreation: match.gameCreation,
        didWin: participant.teamId === match.teams.find(({ win }) => win === 'Win').teamId,
        championName: champion.name,
        kills: participant.stats.kills,
        deaths: participant.stats.deaths,
        assists: participant.stats.assists,
        queue: match.queueId
    };
}

const processChamp = (championIdMap, champ) => {
    let champName, champLevel, champPoints;
    if (champ === null) {
        champName = 'None';
        champLevel = 0;
        champPoints = '';
    } else {
        champName = championIdMap.data[champ.championId].name;
        champLevel = champ.championLevel;
        champPoints = champ.championPoints;
    }
    return {
        name: champName,
        level: champLevel,
        points: champPoints
    };
};

const processLastMatch = match => {
    const seconds = Math.floor((Date.now() - match.gameCreation) / 1000);
    let intervalType;
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        intervalType = 'year';
    } else {
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            intervalType = 'month';
        } else {
            interval = Math.floor(seconds / 86400);
            if (interval >= 1) {
                intervalType = 'day';
            } else {
                interval = Math.floor(seconds / 3600);
                if (interval >= 1) {
                    intervalType = 'hour';
                } else {
                    interval = Math.floor(seconds / 60);
                    if (interval >= 1) {
                        intervalType = 'minute';
                    } else {
                        interval = seconds;
                        intervalType = 'second';
                    }
                }
            }
        }
    }
    if (interval > 1 || interval === 0) {
        intervalType += 's';
    }

    return {
        didWin: (match.didWin ? 'Win' : 'Loss'),
        queue: queues[match.queue],
        champion: match.championName,
        kills: match.kills,
        deaths: match.deaths,
        assists: match.assists,
        whenPlayed: `${interval} ${intervalType} ago`
    };
};

const processRanked = list => {
    for (let i = 0; i < list.length; i++) {
        if (list[i].queueType === 'RANKED_SOLO_5x5') {
            const numMatches = list[i].wins + list[i].losses;
            const rate = Math.ceil((list[i].wins / numMatches) * 100);
            return `**${list[i].tier} ${list[i].rank}**\n${list[i].leaguePoints} LP / ${list[i].wins}W ${list[i].losses}L\nWR: ${rate}%`;
        }
    }
    return '**Unranked**';
};

module.exports = {
    name: 'profile',
    description: 'Shows the summoner profile for a particular user',
    usage: '!hechan profile [region] [summoner]',
    async run(client, message, args, kayn, REGIONS) {
        let numMatches = 10;
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
            await Summoner.findOne({ userID: message.author.id }).exec(function (err, result) {
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

        message.channel.send('Gathering summoner data...');

        // prep for getting match data
        const championIdMap = await kayn.DDragon.Champion.listDataByIdWithParentAsId();
        const { id, accountId, profileIconId, summonerLevel } = await kayn.Summoner.by.name(summonerName).region(region);
        let matches;
        await kayn.Matchlist.by.accountID(accountId)
            .then(dto => {
                matches = dto.matches;
            })
            .catch(err => {
                matches = null;
            });

        let numWins;
        let numLosses;
        let winPercent;
        let kda;
        let lastMatchOutput;
        if (matches === null) { // check if no match history
            numMatches = 0;
            numWins = 0;
            numLosses = 0;
            winPercent = 0;
            kda = 0;
            kda = kda.toFixed(2);
            lastMatchOutput = 'None';
        } else {
            const gameIds = matches.slice(0, numMatches).map(({ gameId }) => gameId);
            const games = await Promise.all(gameIds.map(kayn.Match.get));

            // last 10 games data
            const processor = match => processMatch(championIdMap, id, match);
            const results = await Promise.all(games.map(processor));
            numWins = 0;
            results.forEach(result => { if (result.didWin) numWins++ });
            numLosses = numMatches - numWins;
            winPercent = Math.ceil((numWins / numMatches) * 100);
            const totalKills = results.reduce(function (a, b) {
                return a + b.kills;
            }, 0);
            const totalAssists = results.reduce(function (a, b) {
                return a + b.assists;
            }, 0);
            const totalDeaths = results.reduce(function (a, b) {
                return a + b.deaths;
            }, 0);
            kda = ((totalKills + totalAssists) / totalDeaths).toFixed(2);

            // last game data
            const lastMatch = processLastMatch(results[0]);
            lastMatchOutput = `**[${lastMatch.didWin}] ${lastMatch.queue}** game as **${lastMatch.champion}** with **${lastMatch.kills}/${lastMatch.deaths}/${lastMatch.assists}**, ${lastMatch.whenPlayed}.`;
        }

        // top champs data
        const totalScore = await kayn.ChampionMastery.totalScore(id);
        const listOfChamps = await kayn.ChampionMastery.list(id);
        const topThree = listOfChamps.slice(0, 3);
        let topData = [];
        for (let i = 0; i < 3; i++) {
            if (typeof topThree[i] !== 'undefined') {
                topData.push(processChamp(championIdMap, topThree[i]));
            } else {
                topData.push(processChamp(championIdMap, null));
            }
        }

        // ranked data
        const rankedStats = await kayn.League.Entries.by.summonerID(id);
        const ranked = processRanked(rankedStats);

        // output profile to Discord
        const embed = new Discord.RichEmbed()
            .setAuthor(`Summoner Profile: ${summonerName} [${region.toUpperCase()}]`)
            .setThumbnail(`https://opgg-static.akamaized.net/images/profile_icons/profileIcon${profileIconId}.jpg`)
            .setColor(0x86DBC7)
            .setDescription(`Here is some information about ${summonerName} [${region.toUpperCase()}].`)
            .addField('Level/Total Mastery Score:', `${summonerLevel} / ${totalScore}`, true)
            .addField('Last 10 Games [All Queues]:', `${numMatches}G ${numWins}W ${numLosses}L / ${winPercent}% WR / ${kda}:1`, true)
            .addField('Most Played Champions:', `1. ${topData[0].name}: ${topData[0].points} [Lv. ${topData[0].level}]\n2. ${topData[1].name}: ${topData[1].points} [Lv. ${topData[1].level}]\n3. ${topData[2].name}: ${topData[2].points} [Lv. ${topData[2].level}]`, true)
            .addField('Ranked Stats [Solo/Duo]:', ranked, true)
            .addField('Last Game Played:', lastMatchOutput);
        // last 20 games, top champs, ranked stats, last played
        return message.channel.send(embed);
    }
};