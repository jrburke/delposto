/**
 * @license Copyright (c) 2012, James Burke All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/delposto for details
 */

/*jslint node: true, nomen: true */

'use strict';

var file = require('../lib/file'),
    path = require('path');

function create(args) {
    var name = args[0],
        cwd = process.cwd(),
        dir = path.join(cwd, name);

    if (!name) {
        console.log('Please pass a name for the project');
        process.exit(1);
    }

    if (file.exists(dir)) {
        console.log(dir + ' already exists');
        process.exit(1);
    }

    file.mkdirs(dir);
    file.mkdirs(path.join(dir, 'drafts'));
    file.mkdirs(path.join(dir, 'published'));
    file.mkdirs(path.join(dir, 'src-published'));
    file.copyDir(path.join(__dirname, '..', 'templates'), path.join(dir, 'templates'));

    process.chdir(dir);

    console.log(dir + ' created.');
    console.log('cd to the directory then do `delposto draft` to create a new draft in the "drafts" folder');
}

create.summary = 'Creates a delposto project.';

module.exports = create;