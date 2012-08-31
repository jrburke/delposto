/**
 * @license Copyright (c) 2012, James Burke All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/delposto for details
 */

/*jslint node: true, nomen: true, regexp: true */

'use strict';

var file = require('../lib/file'),
    path = require('path'),
    post = require('../lib/post'),
    render = require('../lib/render'),
    lang = require('../lib/lang'),
    slug = require('slug'),
    Showdown = require('showdown'),
    showdownConverter = new Showdown.converter(),

    pubSrcRegExp = /\bsrc-published\b/,

    //How many characters to use for the "description" of a
    //post, which is just that set of characters from the
    //markdown source of the post
    descLimit = 256,

    //How many posts to show on the home page and atom feeds
    truncateLimit = 5;

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

function extractDescription(desc) {
    desc = (desc || '').trim();
    var text = /[^\r\n]*/.exec(desc);
    text = text[0];

    return text.length > descLimit ? text.substring(0, descLimit) + '...' :
            text;
}

function publish(args) {
    var draftContents, postData, html, sluggedTitle, pubList,
        truncatedPostData = {},
        metadata = {
            published: []
        },
        tags = {
            unique: {},
            list: []
        },
        tagSummaryData = {
            tags: []
        },
        cwd = process.cwd(),
        draftPath = args[0],
        jsonPath = path.join(cwd, 'published.json'),
        pubDate = new Date(),
        postIsoDate = pubDate.toISOString(),
        postTime = pubDate.getTime(),
        pubDir = path.join(cwd, 'published'),
        pubSrcDir = path.join(cwd, 'src-published'),
        dateDir = getDateDir(),
        shortPubPath = dateDir + '/',
        pubPath = path.join(pubDir, dateDir),
        pubSrcPath = path.join(pubSrcDir, dateDir),
        aboutTemplate = file.read(path.join(cwd, 'templates', 'about', 'index.html')),
        postTemplate = file.read(path.join(cwd, 'templates', 'date', 'title',
                       'index.html')),
        tagSummaryTemplate = file.read(path.join(cwd, 'templates', 'tags',
                            'index.html')),
        tagIndexTemplate = file.read(path.join(cwd, 'templates', 'tags', 'name',
                           'index.html')),
        tagAtomTemplate = file.read(path.join(cwd, 'templates', 'tags',
                           'name', 'atom.xml'));

    if (!file.exists(pubDir)) {
        console.log('This does not appear to be a delposto project. ' +
                    'Expected a "published" folder.');
        process.exit(1);
    }

    if (draftPath && !file.exists(draftPath)) {
        console.log(draftPath + ' does not exist');
        process.exit(1);
    }

    if (file.exists(jsonPath)) {
        metadata = JSON.parse(file.read(jsonPath));
    }

    if (draftPath) {
        postData = post.fromFile(draftPath);

        shortPubPath += postData.sluggedTitle;
        if (!metadata.published.some(function (item) {
                return item.path === shortPubPath;
            })) {
            metadata.published.unshift({
                title: postData.title,
                path: shortPubPath,
                postTime: postTime,
                postIsoDate: postIsoDate
            });

            metadata.updatedTime = postTime;
            metadata.updatedIsoDate = postIsoDate;
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
    }

    //Load up all the posts to generate the front page and pages.
    pubList = metadata.published.filter(function (item) {
        var postData, description, postPath,
            data = {},
            srcPath = path.join(cwd, 'src-published', item.path, 'index.md');

        if (file.exists(srcPath)) {
            postData = post.fromFile(srcPath);
            lang.mixin(item, postData);

            //Store off tags
            if (postData.headers.tags) {
                postData.headers.tags.forEach(function (tag) {
                    if (!tags.unique[tag]) {
                        tags.list.push(tag);
                        tags.unique[tag] = [];
                    }
                    tags.unique[tag].push(item);
                });
            }

            //Attach some data that is useful for templates
            item.blogTitle = metadata.title;
            item.atomUrl = metadata.atomUrl;
            item.url = metadata.url + item.path + '/';

            item.description = extractDescription(postData.content);

            //Write out the post in HTML form.
            postPath = path.join(pubDir, item.path);
            file.mkdirs(postPath);
            lang.mixin(data, item);
            html = render(postTemplate, data);
            file.write(path.join(postPath, 'index.html'), html);

            return true;
        } else {
            console.log('WARNING: ' + srcPath + ' no longer exists. You ' +
                        'may want to remove that from published.json');
        }
    });

    //Use pubList for the metadata.published because it should only
    //contain real, existing posts.
    metadata.published = pubList;

    //Create an abbreviated, summary form of the metadata for use in
    //summaries like home page and atom feed.
    lang.mixin(truncatedPostData, metadata, true);
    lang.mixin(truncatedPostData, {
        published: pubList.slice(0, truncateLimit)
    }, true);

    //Generate the front page
    html = render(file.read(path.join(cwd, 'templates', 'index.html')),
                  truncatedPostData);
    file.write(path.join(pubDir, 'index.html'), html);

    //the about page
    html = render(aboutTemplate, truncatedPostData);
    file.mkdirs(path.join(pubDir, 'about'));
    file.write(path.join(pubDir, 'about', 'index.html'), html);

    //Generate the atom.xml feed
    html = render(file.read(path.join(cwd, 'templates', 'atom.xml')),
                  truncatedPostData);
    file.write(path.join(pubDir, 'atom.xml'), html);

    //Generate the archives page
    html = render(file.read(path.join(cwd, 'templates', 'archives', 'index.html')),
                  metadata);
    file.mkdirs(path.join(pubDir, 'archives'));
    file.write(path.join(pubDir, 'archives', 'index.html'), html);

    //Generate the tag page/tag atom feed.
    tags.list.sort();
    tags.list.forEach(function (tag) {
        var tagSlug = slug(tag),
            tagPath = path.join(pubDir, 'tags', tagSlug),
            published = tags.unique[tag],
            tagUrl = tagSlug + '/',
            url = metadata.url + 'tags/' + tagUrl,
            lastPost = published && published[0],
            tagData = {
                tag: tag,
                tagSlug: tagSlug,
                tagUrl: tagUrl,
                url: url,
                atomUrl: url + 'atom.xml',
                updatedIsoDate: lastPost.postIsoDate,
                published: published
            };

        //Save tag info for tag summary page.
        tagSummaryData.tags.push(tagData);

        //Tag's index.
        file.mkdirs(tagPath);
        lang.mixin(tagData, metadata);
        html = render(tagIndexTemplate, tagData);
        file.write(path.join(tagPath, 'index.html'), html);

        //Atom feed, limit to truncate limit
        tagData.published = tagData.published.slice(0, truncateLimit);
        html = render(tagAtomTemplate, tagData);
        file.write(path.join(tagPath, 'atom.xml'), html);
    });

    //Generate tag summary.
    file.mkdirs(path.join(pubDir, 'tags'));
    lang.mixin(tagSummaryData, metadata);
    html = render(tagSummaryTemplate, tagSummaryData);
    file.write(path.join(pubDir, 'tags', 'index.html'), html);

    if (draftPath) {
        console.log('Published ' + draftPath + ' to ' + pubPath);
    }
}

publish.summary = 'Publishes a draft post in the "drafts" folder to ' +
                  '"published" updates the "built" directory with the post.';

module.exports = publish;