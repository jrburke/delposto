/*jslint node: true */
'use strict';

var path = require('path'),
    file = require('./file'),
    cwd = process.cwd(),
    dirs = {
        published: path.join(cwd, 'published'),
        srcPublished: path.join(cwd, 'src-published'),
        drafts: path.join(cwd, 'drafts'),
        templates: path.join(cwd, 'templates')
    };

if (!file.exists(dirs.published)) {
    console.log('This does not appear to be a delposto project. ' +
                'Expected a "published" folder.');
    process.exit(1);
}

module.exports = dirs;
