//Renders an HTML template to final HTML
/*jslint node: true */
'use strict';

var partials,
    mustache = require('mustache'),
    fs = require('fs'),
    path = require('path'),
    file = require('../file');

function loadPartials() {
    partials = {};

    var partialTemplatePath = path.join(process.cwd(), 'templates', 'partials');

    //Load partials
    fs.readdirSync(partialTemplatePath).forEach(function (fileName) {
        partials[path.basename(fileName, path.extname(fileName))] = file.read(path.join(partialTemplatePath, fileName));
    });
}

function render(template, data) {
    if (!partials) {
        loadPartials();
    }

    return mustache.render(template, data, partials);
}

module.exports = render;
