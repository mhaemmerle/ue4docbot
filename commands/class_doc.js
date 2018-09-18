const $ = require('cheerio')
const fs = require('fs')

const basePath = 'D:\\doc\\ue4\\api.unrealengine.com\\INT\\API';
const baseUrl = 'https://api.unrealengine.com/INT/API';

const classMap = new Map();

function parseClasses() {
    var htmlString = fs.readFileSync(basePath + '\\Classes\\index.html').toString()
    var parsedHTML = $.load(htmlString)
    var matched = parsedHTML('.memberindexitem');

    matched.map(function(i, item) {
        item = $(item);
    
        const className = item.text().trim();
        const linkItem = item.find('a');
        const hrefItem = linkItem.attr('href');
        const dotRegex = /\.\./;
        const cleanUrl = hrefItem.replace(dotRegex, '');
        const docUrl = baseUrl + cleanUrl;
    
        classMap.set(className.toLowerCase(), docUrl);

        const filePath = basePath + cleanUrl;

        if(fs.existsSync(filePath)) {
            const subPath = cleanUrl.replace(/index.html/g,'');
            const methodMap = parseMethods(filePath, subPath);

            console.log(`Parsing ${i + 1}/${matched.length} --- ${filePath}`);

            classMap.set(className.toLowerCase() + '|methods', methodMap);
        } else {
            console.log('File not found: ' + filePath);
        }
    });
    
    htmlString = null;
    parsedHTML = null;
    matched = null;
}

function parseMethods(filePath, subPath) {
    var htmlString = fs.readFileSync(filePath).toString()
    var parsedHTML = $.load(htmlString)

    const methodMap = new Map();

    parsedHTML('.name-cell a').map(function(i, item) {
        item = $(item);
        const methodName = item.text().trim().replace(/\(\)/g,'');
        const href = item.attr('href');

        var docUrl = '';

        if(href.startsWith(baseUrl)) {
            docUrl = href;
        } else {
            docUrl = baseUrl + subPath + href;
        }

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
                },
                {
                    id: 'method',
                    type: (word, message, args) => {
                        if(args.clazz !== null && args.clazz !== '') {
                            const clazz = args.clazz.toLowerCase();
                
                            if(classMap.has(clazz)) {
                                args.classUrl = classMap.get(clazz);
                            } else {
                                return null;
                            }
                        }

                        if (!word) return null;

                        if(args.searchResult === undefined) {
                            if(word !== null && word !== '') {
                                args.searchTerm = word;

                                const method = word.toLowerCase();
                                const clazz = args.clazz.toLowerCase();
                                const methodMap = classMap.get(clazz + '|methods');
    
                                if(methodMap !== undefined) {
                                    const result = methodsStartingWith(methodMap, method);
    
                                    args.searchResult = result;
                                }
                            }
                        }

                        if (args.searchResult.length < 2 || args.searchResult.length > 19) {
                            return true;
                        }
                        
                        if (isNaN(word)) {
                            return null;
                        }

                        const num = parseInt(word);

                        if(num >= args.searchResult.length) {
                            return null;
                        }

                        return num;
                    },
                    prompt: {
                        start: (message, args) => {
                            const list =  args.searchResult.map((item, index) => {
                                return `${item.name} (${index})`;
                            });
                            const msg = "More than one method found for '" + args.searchTerm + "'. Select: " + list.join(', ');
                            return `${message.author} ` + msg;
                        },
                        retry: (message, args) => {
                            return `${message.author} Please pick a search result!`;
                        },
                        optional: true
                    }
                }
            ]
        });
    }

    exec(message, args) {
        if(args.clazz !== null && args.clazz !== '') {
            const clazz = args.clazz.toLowerCase();

            if(classMap.has(clazz)) {
                if(args.searchResult !== undefined) {
                    const methodMap = classMap.get(clazz + '|methods');

                    if(args.searchResult.length == 0) {
                        return message.reply("No method named '" + args.method + "' found on '" + args.clazz + "'.");
                    } else if(args.searchResult.length == 1) {
                        const key = args.searchResult[0].name.toLowerCase();
                        return message.reply(methodMap.get(key).url);
                    } else if(args.searchResult.length >= 20) {
                        // TODO
                        // look at message length instead of result size
                        return message.reply("Found too many results for '" + args.method + "'. Can you be more precise?");
                    } else if(args.method !== undefined) {
                        const key = args.searchResult[args.method].name.toLowerCase();
                        return message.reply(methodMap.get(key).url);
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

console.log('ClassDocCommand loaded.');
