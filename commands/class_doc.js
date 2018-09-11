var $ = require('cheerio')
var fs = require('fs')

var htmlString = fs.readFileSync('index.html').toString()
var parsedHTML = $.load(htmlString)

const baseLink = 'https://api.unrealengine.com/INT/API'
var classMap = new Map()

parsedHTML('.memberindexitem').map(function(i, item) {
    item = $(item);
    item.find('span').remove();

    var className = item.text().trim();

    var linkItem = item.find('a');
    var hrefItem = linkItem.attr('href');
    var dotRegex = /\.\./;
    var docLink = baseLink + hrefItem.replace(dotRegex, '');

    classMap.set(className.toLowerCase(), docLink);
});

htmlString = null;
parsedHTML = null;

const { Command } = require('discord-akairo');

class ClassDocCommand extends Command {
    constructor() {
        super('doc', {
            aliases: ['doc', 'class'],
            args: [
                {
                    id: 'clazz',
                    type: 'string'
                }
            ]
        });
    }

    exec(message, args) {
        if(args.clazz !== null && args.clazz !== '') {
            var clazz = args.clazz.toLowerCase();

            if(classMap.has(clazz)) {
                return message.reply(classMap.get(clazz));
            }
            else {
                return message.reply("Class '" + args.clazz + "' not found.");
            }
        } else {
            return message.reply("Missing class name.");
        }
    }
}

module.exports = ClassDocCommand;
