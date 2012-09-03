/*jslint node: true */
'use strict';

var data,
    publicData = {},
    fs = require('fs'),
    path = require('path'),
    file = require('./file'),
    lang = require('./lang'),
    jsonPath = path.join(process.cwd(), 'meta.json');

function getDomain(url) {
    //Extracts the domain from an url.
    return url.substring(url.indexOf('//') + 2).split('/').shift();
}

function meta() {
    if (!data) {
        if (file.exists(jsonPath)) {
            data = JSON.parse(file.read(jsonPath));

            lang.mixin(publicData, data);
            publicData.blogTitle = data.title;
            publicData.blogDomain = getDomain(data.url);
        } else {
            console.log('No meta.json at ' + jsonPath + '. ' +
                        'Use delposto create to creat a new blog that will ' +
                        'include generating a meta.json file.');
            process.exit(1);
        }
    }
    return data;
}

meta.save = function () {
    if (data) {
        file.write(jsonPath, JSON.stringify(data, null, '  '));
    }
};

module.exports = meta;