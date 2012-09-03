
/*jslint node: true */
'use strict';

var templates, cache,
    fs = require('fs'),
    path = require('path'),
    file = require('./file'),
    templateDir = path.join(process.cwd(), 'templates'),
    nameRegExp = /[\.\-]/g;

function addDir(obj, location) {
    fs.readdirSync(location).forEach(function (entry) {
        var ext,
            fullPath = path.join(location, entry),
            key = entry.replace(nameRegExp, '_');

        if (fs.statSync(fullPath).isDirectory()) {
            obj[key] = {};
            addDir(obj[key], fullPath);
        } else {
            ext = path.extname(entry);
            if (ext) {
                //trim leading dot.
                ext = ext.substring(1);
            }

            if (templates.textExtensions[ext]) {
                obj[key] = file.read(fullPath);
            }
        }
    });
}

templates = function () {
    if (!cache) {
        cache = {};
        addDir(cache, templateDir);
    }
    return cache;
};

templates.textExtensions = {
    'html': true,
    'htm': true,
    'txt': true,
    'css': true,
    'js': true,
    'md': true
};

//Support directories/files that are not treated as templates, but
//copied over directly to output.
templates.support = {
    'img': true,
    'js': true,
    'css': true
};

templates.copySupport = function (targetDir) {
    Object.keys(templates.support).forEach(function (name) {
        file.copyDir(path.join(templateDir, name), path.join(targetDir, name));
    });
};


module.exports = templates;