/**
 * @license Copyright (c) 2012, James Burke All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/delposto for details
 */

/*jslint node: true, nomen: true */

'use strict';

var version = '0.0.1',
    exists = require('./lib/exists'),
    path = require('path'),
    fs = require('fs'),
    commandDir = __dirname + '/commands/';

function printHelp(command, firstArg) {
    var commandModule;

    if ((command === '-h' || command === 'help') && firstArg) {
        if (exists(path.join(commandDir, firstArg) + '.js')) {
            command = firstArg;
        } else {
            command = null;
        }
    }

    if (!exists(path.join(commandDir, command) + '.js')) {
        command = null;
    }

    if (command) {
        commandModule = require('./commands/' + command);
        console.log(commandModule.doc ||
                    commandModule.summary ||
                    'No docs available');
    } else {
        console.log(path.basename(process.argv[1]) + ' version ' + version +
            '. Commands:\n');

        fs.readdirSync(commandDir).forEach(function (command) {
            console.log(command.replace(/\.js$/, '') + ': ' +
                (require('./commands/' + command).summary || ''));
        });
    }
}

function main(args) {
    var command = args[0],
        firstArg = args[1],
        hasCommand = command &&
            exists(path.join(commandDir, command + '.js'));

    if (!command || !hasCommand || firstArg === '-h' || firstArg === 'help') {
        printHelp(command, firstArg);
        process.exit();
    }

    require('./commands/' + command)(args.slice(1));
}


module.exports = main;
