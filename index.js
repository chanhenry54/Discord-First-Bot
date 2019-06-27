// startup declarations
require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    // ignore bot messages
    if (msg.author.bot) { return; }

    // 'ping' interaction
    if (msg.content.toLowerCase() === 'ping') {
        msg.channel.send('Pong!');
    }

    // 'no u' interaction
    if (msg.content.toLowerCase() === 'no u') {
        msg.channel.send('No u!');
    }

    // 'owo' interaction
    if (msg.content.toLowerCase() === 'owo') {
        msg.channel.send('uwu');
    }

    // 'uwu' interaction
    if (msg.content.toLowerCase() === 'uwu') {
        msg.channel.send('owo');
    }

    /*
     * !hechan commands
     */
    if (!msg.content.startsWith(process.env.PREFIX)) { return; }
    const args = msg.content.slice(process.env.PREFIX.length).trim().split(/ + /g);
    const command = args.shift().toLowerCase();

    switch (command) {
        // help command
        case 'help':
            msg.author.send({
                embed: {
                    "color": 8838087,
                    "fields": [
                        {
                            "name": "Hechan Commands",
                            "value": "Here is a list of all available Hechan commands and parameters."
                        },
                        {
                            "name": "!hechan help",
                            "value": "Displays this help guide"
                        }
                    ]
                }
            });
            break;
        // unknown command
        default:
            msg.author.send(msg + ': invalid command!');
            break;
    }
});

client.login(process.env.BOT_TOKEN);