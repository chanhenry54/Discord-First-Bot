// startup declarations
const Discord = require('discord.js');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const client = new Discord.Client();

// connect to MongoDB
mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PWD}@ds253567.mlab.com:53567/heroku_6z2twk23`, { useNewUrlParser: true }, err => {
    if (err) { return console.error(err); }
    console.log('Connected to database');
});

process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Disconnected from database on bot shutdown');
        process.exit();
    });
});

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