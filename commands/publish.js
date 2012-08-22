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
    render = require('../lib/render'),
    Showdown = require('showdown'),
    showdownConverter = new Showdown.converter(),

    pubSrcRegExp = /\bsrc-published\b/;

function twoDigit(num) {
    if (num < 10) {
        return '0' + num;
    } else {
        return num;
    }
}

function getDateDir() {
    var now = new Date();
    return [now.getFullYear().toString(),
                           twoDigit(now.getMonth() + 1).toString(),
                           twoDigit(now.getDate()).toString()].join('');
}

function publish(args) {
    var draftContents, postData, html, sluggedTitle, pubList,
        metadata = {
            published: []
        },
        cwd = process.cwd(),
        draftPath = args[0],
        jsonPath = path.join(cwd, 'published.json'),
        pubDir = path.join(cwd, 'published'),
        pubSrcDir = path.join(cwd, 'src-published'),
        dateDir = getDateDir(),
        shortPubPath = dateDir + '/',
        pubPath = path.join(pubDir, dateDir),
        pubSrcPath = path.join(pubSrcDir, dateDir);

    if (!file.exists(pubDir)) {
        console.log('This does not appear to be a delposto project. ' +
                    'Expected a "published" folder.');
        process.exit(1);
    }

    if (!draftPath || !file.exists(draftPath)) {
        console.log(draftPath + ' does not exist');
        process.exit(1);
    }

    if (file.exists(jsonPath)) {
        metadata = JSON.parse(file.read(jsonPath));
    }

    postData = post.fromFile(draftPath);

    //Write out the post in HTML form.
    pubPath = path.join(pubPath, postData.sluggedTitle);
    file.mkdirs(pubPath);
    html = render.fromFile(path.join(cwd, 'templates', 'date', 'title', 'index.html'), {
        title: postData.title,
        content: postData.htmlContent
    });
    file.write(path.join(pubPath, 'index.html'), html);

    shortPubPath += postData.sluggedTitle;
    if (!metadata.published.some(function (item) {
            return item.path === shortPubPath;
        })) {
        metadata.published.unshift({
            title: postData.title,
            path: shortPubPath
        });
    }
    file.write(jsonPath, JSON.stringify(metadata, null, '  '));

    //Move the .md file to published-src, but only if the source
    //is not already in the published area
    if (!pubSrcRegExp.test(draftPath)) {
        pubSrcPath = path.join(pubSrcPath, postData.sluggedTitle);
        file.mkdirs(pubSrcPath);
        file.copyFile(draftPath, path.join(pubSrcPath, 'index.md'));
        file.rm(draftPath);
    }

    //Load up all the posts to generate the front page and pages.
    pubList = metadata.published.filter(function (item) {
        var postData,
            srcPath = path.join(cwd, 'src-published', item.path, 'index.md');
console.log('CHECKING PATH: ' + srcPath);
        if (file.exists(srcPath)) {
            postData = post.fromFile(srcPath);
            item.content = postData.content;
            item.htmlContent = postData.htmlContent;
            return true;
        }
    });

console.log('pubList: ' + pubList);

    //Update the front page
    html = render(file.read(path.join(cwd, 'templates', 'index.html')), {
        published: pubList.slice(0, 4)
    });
    file.write(path.join(cwd, 'published', 'index.html'), html);

    console.log('Published ' + draftPath + ' to ' + pubPath);
}

publish.summary = 'Publishes a draft post in the "drafts" folder to ' +
                  '"published" updates the "built" directory with the post.';

module.exports = publish;