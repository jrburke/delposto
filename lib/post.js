/*jslint node: true, regexp: true */
'use strict';

var fs = require('fs'),
    yaml = require('js-yaml'),
    slug = require('slug'),
    Showdown = require('showdown'),
    converter = new Showdown.converter(),

    maxSlugLength = 50,
    toLineEndRegExp = /(.*)[\r\n$]/,
    cache = {};

function post(content) {
    content = content || '';

    var sluggedTitle,
        title = '',
        headers = {},
        index = content.indexOf('~');

    //Separate out headers.
    if (index !== -1) {
        headers = content.substring(0, index);
        headers = yaml.load(headers);
        content = content.substring(index + 1, content.length);
    }

    //Find the title, the first header tag
    index = content.indexOf('#');
    if (headers.title) {
        title = headers.title;
    } else {
        title = (new Date()).getTime().toString();
    }
    title = title.trim();

    //Generate title and limit its length.
    sluggedTitle = slug(headers.slug || title);
    if (sluggedTitle.length > maxSlugLength) {
        sluggedTitle.substring(0, maxSlugLength);
        index = sluggedTitle.lastIndexOf('-');
        if (index !== -1) {
            sluggedTitle = sluggedTitle.substring(0, index);
        }
    }
    //Go all lowercase
    sluggedTitle = sluggedTitle.toLowerCase();

    return {
        title: title,
        sluggedTitle: sluggedTitle,
        headers: headers,
        content: content,
        htmlContent: converter.makeHtml(content)
    };
}

post.cache = cache;

post.fromFile = function (path) {
    if (!cache[path]) {
        cache[path] = post(fs.readFileSync(path, 'utf8'));
    }
    return cache[path];
};

module.exports = post;
