/**
 * @license Copyright (c) 2012, James Burke All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/delposto for details
 */

/*jslint node: true, nomen: true */

'use strict';

var fs = require('fs'),
    path = require('path'),
    publish = require('./publish'),
    post = require('../lib/post'),
    file = require('../lib/file'),
    dirs = require('../lib/dirs'),
    post = require('../lib/post'),
    templates = require('../lib/templates');

function preview(args) {

    var draftDir, srcTarget,
        draftPath = args[0];

    if (!file.exists(draftPath)) {
        console.log('Draft path does not exist: ' + draftPath);
        process.exit(1);
    }

    if (fs.statSync(draftPath).isDirectory()) {
        draftDir = draftPath;
        draftPath = path.join(draftDir, 'index.md');
    }

    srcTarget = draftDir || draftPath;

    function triggerPublish() {
        delete post.cache[draftPath];

        var elapsed,
            startTime = (new Date()).getTime(),
            postDate = new Date(),
            postData = post.fromFile(draftPath),
            previewPath = 'preview/month/day/' + postData.sluggedTitle,
            item = {
                title: postData.title,
                path: previewPath,
                postTime: postDate.getTime(),
                postIsoDate: postDate.toISOString()
            };

        //Clear out any old data
        file.rm(path.join(dirs.published, 'preview'));
        file.rm(path.join(dirs.srcPublished, 'preview'));

        publish.mixinData(srcTarget, item);
        publish.renderPost(srcTarget, item);

        templates.copySupport(dirs.published);

        elapsed = ((new Date()).getTime() - startTime) / 1000;
        console.log('Updated preview of ' + srcTarget + ' at published/' +
                    item.path + '/, ' + elapsed + ' seconds.');
    }

    triggerPublish();

    //Set up a watch on the draftPath
    fs.watch(draftPath, triggerPublish);

    console.log('Watching ' + draftPath + ' for changes...');
}

preview.summary = 'Previews a draft by rendering it in published/preview';

module.exports = preview;