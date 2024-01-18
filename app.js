const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const config = require('./config.json');

const DISCORD_TOKEN = config.discordToken;
const PUSHOVER_TOKEN = config.pushoverToken;
const PUSHOVER_USER = config.pushoverUser;
const GUILD_ID = config.guildId;
const MEMBER_ID = config.memberId;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences] });

let offlineSince = null;
let userName = "";

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    checkStatusPeriodically();
});

function checkStatusPeriodically() {
    setInterval(async () => {
        const guild = await client.guilds.fetch(GUILD_ID);
        const member = await guild.members.fetch(MEMBER_ID);
        userName = member.displayName;

        if (member.presence?.status === 'offline') {
            if (!offlineSince) {
                offlineSince = new Date();
            } else if (new Date() - offlineSince > 120000) { // 2 minutes in milliseconds
                sendPushoverNotification();
                offlineSince = null; // Reset the timer
            }
        } else {
            offlineSince = null; // Reset if the member is online
        }
    }, 30000); // 30 seconds interval
}

function sendPushoverNotification() {
    axios.post('https://api.pushover.net/1/messages.json', {
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        message: `The Bot ${userName} has been offline for more than 2 minutes.`,
        priority: 2,
        retry: 300,
        expire: 600,
        sound: "spacealarm"
    }).then(() => {
        console.log('Pushover notification sent.');
    }).catch(error => {
        console.error('Failed to send Pushover notification:', error);
    });
}

client.login(DISCORD_TOKEN);