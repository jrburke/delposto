/**
 * @license Copyright (c) 2012, James Burke All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/delposto for details
 */

/*jslint node: true, nomen: true */

'use strict';

var file = require('../lib/file'),
    path = require('path'),
    ln = process.platform === 'win32' ? '\r\n' : '\n',
    dirRegExp = /[\\\/]$/;

function twoDigit(num) {
    if (num < 10) {
        return '0' + num;
    } else {
        return num;
    }
}

function tempName() {
    var now = new Date();
    return now.getFullYear() + '-' + twoDigit(now.getMonth() + 1) + '-' +
        twoDigit(now.getDate());
}

function draft(args) {
    var draftPath, dir,
        name = (args[0] || tempName()),
        cwd = process.cwd(),
        draftsDir = path.join(cwd, 'drafts');

    if (dirRegExp.test(name)) {
        //Wants a directory, for storing support files for the post.
        name = path.join(name.substring(0, name.length - 1), 'index.md');
    } else {
        name += '.md';
    }

    draftPath = path.join(draftsDir, name);

    if (!file.exists(draftsDir)) {
        console.log('This does not appear to be a delposto project. ' +
                    'Expected a "drafts" folder.');
        process.exit(1);
    }

    if (file.exists(draftPath)) {
        console.log(draftPath + ' already exists. Please pass a different ' +
                    'name to this command.');
        process.exit(1);
    }

    dir = path.dirname(draftPath);
    if (!file.exists(dir)) {
        file.mkdirs(dir);
    }

    file.write(draftPath, 'title: ' + ln +
                          'tags: []' + ln +
                          'comments: ' + ln +
                          '~' + ln + ln);

    console.log('Draft ' + draftPath + ' created.');
}

draft.summary = 'Creates a draft post in the "drafts" folder.';

module.exports = draft;