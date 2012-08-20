/**
 * @license Copyright (c) 2012, James Burke All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/delposto for details
 */

/*jslint node: true, nomen: true */

'use strict';

var file = require('../lib/file'),
    path = require('path'),
    post = require('../lib/post'),
    render = require('../lib/render');

function twoDigit(num) {
    if (num < 10) {
        return '0' + num;
    } else {
        return num;
    }
}

function getDateDir() {
    var now = new Date();
    return path.join(now.getFullYear(), twoDigit(now.getMonth() + 1),
        twoDigit(now.getDate()));
}

function publish(args) {
    var draftContents, postData, html,
        name = args[0] ? args[0] + '.md' : '',
        cwd = process.cwd(),
        draftsDir = path.join(cwd, 'drafts'),
        draftPath = name && path.join(draftsDir, name),
        pubDir = path.join(cwd, 'published'),
        pubPath = path.join(pubDir, getDateDir());

    if (!file.exists(draftsDir)) {
        console.log('This does not appear to be a delposto project. ' +
                    'Expected a "drafts" folder.');
        process.exit(1);
    }

    if (!file.exists(pubDir)) {
        console.log('This does not appear to be a delposto project. ' +
                    'Expected a "published" folder.');
        process.exit(1);
    }

    if (!draftPath || !file.exists(draftPath)) {
        console.log(draftPath + ' does not exist');
        process.exit(1);
    }

    postData = post.fromFile(draftPath);

    pubPath = path.join(pubPath, postData.sluggedTitle);
    file.mkdirs(pubPath);

    //Write out the post in HTML form.
    html = render.fromFile(path.join(__dirname, '../templates/index.html'), {
        title: postData.title,
        content: postData.htmlContent
    });
    file.write(path.join(pubPath, 'index.html'), html);

    console.log('Published ' + draftPath + ' to ' + pubPath);
}

publish.summary = 'Publishes a draft post in the "drafts" folder to ' +
                  '"published" updates the "built" directory with the post.';

module.exports = publish;