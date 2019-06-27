require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    // 'ping' interaction
    if (msg.content.toLowerCase() === 'ping') {
        msg.channel.send('Pong!');
    }
    // 'no u' interaction
    if (msg.content.toLowerCase() === 'no u') {
        msg.channel.send('No u');
    }
});

client.login(process.env.BOT_TOKEN);