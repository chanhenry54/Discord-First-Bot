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
    }
}

module.exports = {
    name: 'profile',
    description: 'Shows the summoner profile for a particular user',
    usage: '!hechan profile [region] [summoner]',
    async run(client, message, args, kayn, REGIONS) {
        const numMatches = 10;
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
        const { matches } = await kayn.Matchlist.by.accountID(accountId);
        const gameIds = matches.slice(0, numMatches).map(({ gameId }) => gameId);
        const games = await Promise.all(gameIds.map(kayn.Match.get));

        // last 10 games data
        const processor = match => processMatch(championIdMap, id, match);
        const results = await Promise.all(games.map(processor));
        let numWins = 0;
        results.forEach(result => { if (result.didWin) numWins++ });
        let numLosses = numMatches - numWins;
        let winPercent = Math.ceil((numWins / numMatches) * 100);
        let totalKillsAssists = results.map(result => result.kills + result.assists).reduce((acc, currTakedowns) => acc + currTakedowns, 0);
        let totalDeaths = results.reduce((acc, currDeaths) => acc + currDeaths, 0);
        let kda = (totalKillsAssists / totalDeaths).toFixed(2);

        //  last game data

        // output profile to Discord
        const embed = new Discord.RichEmbed()
            .setAuthor(`Summoner Profile: ${summonerName} [${region.toUpperCase()}]`)
            .setThumbnail(`https://opgg-static.akamaized.net/images/profile_icons/profileIcon${profileIconId}.jpg`)
            .setColor(0x86DBC7)
            .setDescription(`Here is some information about ${summonerName} [${region.toUpperCase()}].`)
            .addField('Level:', summonerLevel, true)
            .addField('Last 10 Games [All Queues]:', `${numMatches}G ${numWins}W ${numLosses}L / ${winPercent}% WR / ${kda}:1`, true)
            .addField('Last Game Played:', ``, true);
        // last 20 games, top champs, ranked stats, last played
        return message.channel.send(embed);
    }
};