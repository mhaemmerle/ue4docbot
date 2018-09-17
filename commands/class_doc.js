var $ = require('cheerio')
var fs = require('fs')

const basePath = 'Documentation/INT/API';
const baseUrl = 'https://api.unrealengine.com/INT/API';

const classMap = new Map();

function parseClasses() {
    var htmlString = fs.readFileSync(basePath + '/Classes/index.html').toString()
    var parsedHTML = $.load(htmlString)

    parsedHTML('.memberindexitem').map(function(i, item) {
        item = $(item);
        item.find('span').remove();
    
        const className = item.text().trim();
        const linkItem = item.find('a');
        const hrefItem = linkItem.attr('href');
        const dotRegex = /\.\./;
        const cleanUrl = hrefItem.replace(dotRegex, '');
        const docUrl = baseUrl + cleanUrl;
    
        classMap.set(className.toLowerCase(), docUrl);

        if(className == 'AActor') {
            const filePath = basePath + cleanUrl;
            const subPath = cleanUrl.replace(/index.html/g,'');

            // console.log('filePath ' + filePath);
            // console.log('subPath ' + subPath);

            const methodMap = parseMethods(filePath, subPath);

            classMap.set(className.toLowerCase() + '|methods', methodMap);
        }
    });
    
    htmlString = null;
    parsedHTML = null;
}

function parseMethods(filePath, subPath) {
    var htmlString = fs.readFileSync(filePath).toString()
    var parsedHTML = $.load(htmlString)

    const methodMap = new Map();

    parsedHTML('.name-cell a').map(function(i, item) {
        item = $(item);
        const methodName = item.text().trim().replace(/\(\)/g,'');
        const href = item.attr('href');
        const docUrl = baseUrl + subPath + href;
    
        methodMap.set(methodName.toLowerCase(), {name: methodName, url: docUrl});
    
        // console.log('methodName ' + methodName + ', docUrl ' + docUrl)
    });

    htmlString = null;
    parsedHTML = null;

    return methodMap;
}

parseClasses();

function methodsStartingWith(methodMap, str) {
    const methods = [];

    for (let methodName of methodMap.keys()) {
        if(methodName.startsWith(str)) {
            methods.push(methodMap.get(methodName));
        }
    }

    return methods;
}

const { Command } = require('discord-akairo');

class ClassDocCommand extends Command {
    constructor() {
        super('doc', {
            aliases: ['doc', 'class'],
            args: [
                {
                    id: 'clazz',
                    type: 'string'
                }, {
                    id: 'method',
                    type: 'string'
                }
            ]
        });
    }

    exec(message, args) {
        if(args.clazz !== null && args.clazz !== '') {
            const clazz = args.clazz.toLowerCase();

            if(classMap.has(clazz)) {
                if(args.method !== null && args.method !== '') {
                    const method = args.method.toLowerCase()

                    // console.log('method supplied: ' + args.method);

                    const methodMap = classMap.get(clazz + '|methods');

                    if(methodMap !== undefined) {
                        const result = methodsStartingWith(methodMap, method);

                        // console.log('found ' + result.length + ' method matches');

                        if(result.length == 0) {
                            return message.reply("No method named '" + args.method + "' found on '" + args.clazz + "'.");
                        } else if(result.length == 1) {
                            const key = result[0].name.toLowerCase();
                            return message.reply(methodMap.get(key).url);
                        } else {
                            const msg = "More than one method found for '" + args.method + "': " + result.map(item => item.name).join(', ');

                            return message.reply(msg);
                        }
                    }
                }

                return message.reply(classMap.get(clazz));
            } else {
                return message.reply("Class '" + args.clazz + "' not found.");
            }
        }
        
        return message.reply("Missing class name.");
    }
}

module.exports = ClassDocCommand;
