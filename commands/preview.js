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
    templates = require('../lib/templates');

function preview(args) {

    var draftPath = args[0];

    function triggerPublish() {
        var postDate = new Date(),
            postData = post.fromFile(draftPath),
            previewPath = 'preview/' + postData.sluggedTitle,
            item = {
                title: postData.title,
                path: previewPath,
                postTime: postDate.getTime(),
                postIsoDate: postDate.toISOString()
            };

        publish.mixinData(draftPath, item);
        publish.renderPost(draftPath, item);

        templates.copySupport(dirs.published);
    }

    //Clear out any old data
    file.rm(path.join(dirs.published, 'preview'));
    file.rm(path.join(dirs.srcPublished, 'preview'));


    triggerPublish();

    //Set up a watch on the draftPath
    fs.watch(draftPath, function (event, filename) {
        //Do not care what changed, just re-render.
        var elapsed,
            startTime = (new Date()).getTime();

        triggerPublish();

        elapsed = ((new Date()).getTime() - startTime) / 1000;
        console.log('Updated preview of ' + draftPath + ', ' + elapsed +
                    ' seconds.');

    });
    console.log('Watching ' + draftPath + ' for changes...');
}

preview.summary = 'Previews a draft by rendering it in published/preview';

module.exports = preview;