//Renders an HTML template to final HTML
/*jslint node: true */
'use strict';

var mustache = require('mustache'),
    file = require('./file');

function render(template, data) {
    return mustache.render(template, data);
}

render.fromFile = function (templatePath, data) {
    return render(file.read(templatePath), data);
};

module.exports = render;