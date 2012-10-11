/**
 * @license Copyright (c) 2012, James Burke All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/delposto for details
 */

/*jslint node: true, nomen: true */

'use strict';

var file = require('../lib/file'),
    path = require('path'),

    endSlashRegExp = /\/$/;

function prompt(message, callback) {
    function onData(data) {
        data = (data || '').toString().trim();
        process.stdin.pause();
        callback(data);
    }

    process.stdin.once('data', onData);
    process.stdin.resume();

    process.stdout.write(message + ' ', 'utf8');
}

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

    //Prompt the user for some info on the blog
    prompt('Blog URL (ex: http://blog.example.com/): ', function (url) {
        if (!url) {
            console.log('Please establish the URL for the blog');
            process.exit(1);
        }

        if (!endSlashRegExp.test(url)) {
            url += '/';
        }

        prompt('Blog title: ', function (title) {
            prompt('Author (ex: Jane Doe): ', function (author) {
                var now = new Date(),
                    urlQuestion = 'Date-based post URLs (ex: ' +
                                      now.getFullYear() +
                                      '/01/post-title) [y]? ';

                prompt(urlQuestion, function (dateBased) {
                    var pubData, postUrlType,
                        isDateBased = true;

                    switch (dateBased.toLowerCase()) {
                    case "N":
                    case "n":
                    case "no":
                    case "0":
                        isDateBased = false;
                        break;
                    }

                    postUrlType = isDateBased ? 'date' : 'path';

                    pubData = {
                        url: url,
                        title: title,
                        author: author,
                        postUrlType: postUrlType,
                        published: []
                    };

                    file.mkdirs(dir);
                    file.mkdirs(path.join(dir, 'drafts'));
                    file.mkdirs(path.join(dir, 'published'));
                    file.mkdirs(path.join(dir, 'src-published'));
                    file.copyDir(path.join(__dirname, '..', 'templates'),
                                 path.join(dir, 'templates'));

                    file.write(path.join(dir, 'meta.json'),
                               JSON.stringify(pubData, null, '  '));

                    console.log(dir + ' created.');
                    console.log('cd to the directory then do `delposto draft` ' +
                                'to create a new draft in the "drafts" folder');
                    if (postUrlType === 'date') {
                        console.log('Post URLs will be automatically generated ' +
                                    'based on the publish date.');
                    } else {
                        console.log("Post URLs will be based on the path to the " +
                                    "posts' draft files and/or their YAML headers.");
                    }
                    console.log('To edit the blog info, modify: ' +
                                path.join(dir, 'meta.json'));
                });
            });
        });
    });
}

create.summary = 'Creates a delposto project.';

module.exports = create;
