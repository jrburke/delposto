//Not really evil, but jslint cannot tell the difference
/*jslint node: true, regexp: true, evil: true */
'use strict';

var file = require('./file'),
    yaml = require('yaml'),
    slug = require('slug'),
    Showdown = require('showdown'),
    converter = new Showdown.converter(),

    maxSlugLength = 50,
    toLineEndRegExp = /(.*)[\r\n$]/;

function post(content) {
    content = content || '';

    var sluggedTitle,
        title = '',
        headers = {},
        index = content.indexOf('~');

    //Separate out headers.
    if (index !== -1) {
        headers = content.substring(0, index);
        headers = yaml['eval'](headers);
        content = content.substring(index + 1, content.length);
    }

    //Find the title, the first header tag
    index = content.indexOf('#');
    if (index === -1) {
        title = (new Date()).getTime().toString();
    } else {
        title = toLineEndRegExp.exec(content.substring(index + 1))[1];
    }
    title = title.trim();

    //Generate title and limit its length.
    sluggedTitle = slug(title);
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

post.fromFile = function (path) {
    return post(file.read(path));
};

module.exports = post;