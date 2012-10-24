/**
 * @license Copyright (c) 2012, James Burke All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/delposto for details
 */

/*jslint node: true, nomen: true, regexp: true */

'use strict';

var file = require('../lib/file'),
    path = require('path'),
    fs = require('fs'),
    post = require('../lib/post'),
    render = require('../lib/render'),
    lang = require('../lib/lang'),
    slug = require('slug'),
    Showdown = require('showdown'),
    dirs = require('../lib/dirs'),
    meta = require('../lib/meta'),
    templates = require('../lib/templates'),
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
                           twoDigit(now.getDate()).toString()].join('/');
}

function getBaseDir(draftPath, isDirectory) {
    var parts = draftPath.split("/");
    parts.shift(); // chop off the leading 'drafts'
    parts.pop(); // chop off the filename

    // if the user created the draft with a trailing slash in the name, the
    // draftPath here will be like drafts/.../name/index.md, so we need to pop
    // off the name too
    if (isDirectory) {
        parts.pop();
    }

    return parts.join("/");
}

function extractDescription(desc) {
    desc = (desc || '').trim();
    var text = /[^\r\n]*/.exec(desc);
    text = text[0];

    return text.length > descLimit ? text.substring(0, descLimit) + '...' :
            text;
}

function draftExists(draftPath) {
    if (draftPath && !file.exists(draftPath)) {
        console.log(draftPath + ' does not exist');
        process.exit(1);
    }
}

function convert(template, data, outPath, rootPath) {
    if (rootPath) {
        data.rootPath = rootPath;
    }
    var html = render(template, data);
    file.write(outPath, html);
}

//Generate a directory in the published area.
function pdir() {
    var dirParts = [dirs.published].concat([].slice.call(arguments, 0));
    return path.join.apply(path, dirParts);
}

function publish(args) {
    var draftContents, postData, html, sluggedTitle, pubList, draftDir, data,
        draftSlug, latestPost,
        truncatedPostData = {},
        tags = {
            unique: {},
            list: []
        },
        tagSummaryData = {
            tags: []
        },
        cwd = process.cwd(),
        draftPath = args[0],
        pubDate = new Date(),
        postIsoDate = pubDate.toISOString(),
        postDateString = pubDate.toUTCString(),
        postTime = pubDate.getTime(),
        pubDir = dirs.published,
        urlType = meta.data.postUrlType || "date",
        baseDir,
        shortPubPath,
        pubPath,
        srcPubPath;

    draftExists(draftPath);

    if (draftPath) {
        //Clean up an previews of the draft
        file.rm(path.join(dirs.published, 'preview'));

        //Figure out if a directory for a draft is in play.
        var isDirectory = fs.statSync(draftPath).isDirectory();
        if (isDirectory) {
            draftDir = draftPath.replace(/[\/\\]$/, '');
            draftPath = path.join(draftDir, 'index.md');
            draftExists(draftPath);
        }

        baseDir = (urlType == "path") ? getBaseDir(draftPath, isDirectory) : getDateDir();
        shortPubPath = baseDir.length ? baseDir + '/' : '';
        pubPath = pdir(baseDir);
        srcPubPath = path.join(dirs.srcPublished, baseDir);

        postData = post.fromFile(draftPath);

        shortPubPath += postData.sluggedTitle;
        draftSlug = postData.sluggedTitle;
        if (!meta.data.published.some(function (item) {
                return item.path === shortPubPath;
            })) {
            meta.data.published.unshift({
                title: postData.title,
                path: shortPubPath,
                postTime: postTime,
                postIsoDate: postIsoDate
            });
        }

        meta.save();

        //Move the .md file to published-src, but only if the source
        //is not already in the published area
        if (!pubSrcRegExp.test(draftPath)) {
            srcPubPath = path.join(srcPubPath, postData.sluggedTitle);
            file.mkdirs(srcPubPath);
            if (draftDir) {
                file.copyDir(draftDir, srcPubPath);
            }
            file.copyFile(draftPath, path.join(srcPubPath, 'index.md'));
            file.rm(draftDir || draftPath);
        }
    }

    latestPost = meta.data.published[0];
    if (latestPost) {
        meta.data.updatedTime = latestPost.postTime;
        meta.data.updatedIsoDate = latestPost.postIsoDate;
    }

    //Load up all the posts to generate the front page and pages.
    pubList = meta.data.published.filter(function (item) {
        var srcDir = path.join(dirs.srcPublished, item.path),
            srcPath = path.join(srcDir, 'index.md');

        if (file.exists(srcPath)) {
            publish.mixinData(srcPath, item);

            publish.renderPost(path.join(dirs.srcPublished, item.path), item);

            postData = post.fromFile(srcPath);

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

            return true;
        } else {
            console.log('WARNING: ' + srcPath + ' no longer exists. You ' +
                        'may want to remove that from meta.json');
        }
    });

    //Use pubList for the meta.data.published because it should only
    //contain real, existing posts.
    meta.data.published = pubList;

    //Create an abbreviated, summary form of the meta for use in
    //summaries like home page and atom feed.
    lang.mixin(truncatedPostData, meta.data, true);
    lang.mixin(truncatedPostData, {
        published: pubList.slice(0, truncateLimit)
    }, true);

    //Generate the tag page/tag atom feed.
    tags.list.sort();
    tags.list.forEach(function (tag) {
        var tagSlug = slug(tag),
            tagPath = pdir('tags', tagSlug),
            published = tags.unique[tag],
            tagUrl = tagSlug + '/',
            url = meta.data.url + 'tags/' + tagUrl,
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
        lang.mixin(tagData, meta.data);
        tagData.atomUrl = url + '/atom.xml';
        convert(templates.text.tags.name.index_html, tagData,
                path.join(tagPath, 'index.html'), '../..');

        //Atom feed, limit to truncate limit
        tagData.published = tagData.published.slice(0, truncateLimit);

        convert(templates.text.tags.name.atom_xml, tagData,
                path.join(tagPath, 'atom.xml'));
    });

    //Generate tag summary.
    lang.mixin(tagSummaryData, meta.data);
    convert(templates.text.tags.index_html, tagSummaryData,
            pdir('tags', 'index.html'), '..');

    //Hold on to the tag summary data for use on top level pages.
    truncatedPostData.tags = tagSummaryData.tags;
    meta.data.tags = tagSummaryData.tags;

    //Generate the front page
    convert(templates.text.index_html, truncatedPostData,
            pdir('index.html'), '.');

    //the about page
    convert(templates.text.about.index_html, truncatedPostData,
            pdir('about', 'index.html'), '..');

    //Generate the atom.xml feed
    convert(templates.text.atom_xml, truncatedPostData, pdir('atom.xml'));

    //Generate the archives page
    data = {};
    lang.mixin(data, meta.data);
    convert(templates.text.archives.index_html, data, pdir('archives',
            'index.html'), '..');

    //Copy over any other directories needed to run.
    templates.copySupport(pubDir);

    if (draftPath) {
        console.log('Published ' + draftPath + ' to ' + pubPath + '/' +
                    draftSlug + '/');
    }
}

publish.mixinData = function (srcPath, publishData) {
    var postData;

    if (fs.statSync(srcPath).isDirectory()) {
        srcPath = path.join(srcPath, 'index.md');
    }

    postData = post.fromFile(srcPath);
    lang.mixin(publishData, postData);

    //Attach some data that is useful for templates
    publishData.blogTitle = meta.data.title;
    publishData.blogDomain = meta.data.blogDomain;
    publishData.atomUrl = meta.data.atomUrl;
    publishData.url = meta.data.url + publishData.path + '/';
    publishData.postDateString = (new Date(publishData.postTime)).toUTCString();

    publishData.description = extractDescription(publishData.content);
};

publish.renderPost = function (srcPath, publishedData) {
    var postPath, srcDir;

    if (fs.statSync(srcPath).isDirectory()) {
        srcDir = srcPath;
        srcPath = path.join(srcDir, 'index.md');
    }

    postPath = path.join(dirs.published, publishedData.path);
    file.mkdirs(postPath);

    //Copy all the files over, except index.md
    if (srcDir) {
        file.copyDir(srcDir, postPath, null, null, /index\.md/);
    }

    //Write out the post in HTML form.
    convert(templates.text.year.month.day.title.index_html, publishedData,
            path.join(postPath, 'index.html'), '../../../..');
};

publish.summary = 'Publishes a draft post in the "drafts" folder to ' +
                  '"published" updates the "built" directory with the post.';

module.exports = publish;
