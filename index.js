// startup declarations
const Discord = require('discord.js');
const fs = require('fs');

const client = new Discord.Client();
const config = require('dotenv').config();
client.config = config;

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// load events from /events folder
fs.readdir('./events/', (err, files) => {
    if (err) { return console.error(err); }
    files.forEach(file => {
        if (!file.endsWith('.js')) { return; }
        const event = require(`./events/${file}`);
        let eventName = file.split('.')[0];

        client.on(eventName, event.bind(null, client));
        delete require.cache[require.resolve(`./events/${file}`)];
    });
});

client.commands = new Map();

// store commands into Map data structure
fs.readdir('./commands/', (err, files) => {
    if (err) { return console.error(err); }
    files.forEach(file => {
        if (!file.endsWith('.js')) { return; }
        let props = require(`./commands/${file}`);
        let commandName = file.split('.')[0];

        console.log(`Attempting to load command ${commandName}`);
        client.commands.set(commandName, props);
    });
});

client.login(process.env.BOT_TOKEN);