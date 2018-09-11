const { AkairoClient } = require('discord-akairo');

const client = new AkairoClient({
    ownerID: '',
    prefix: '?', // or ['?', '!']
    commandDirectory: './commands/'
}, {
    disableEveryone: true
});

client.login('');
