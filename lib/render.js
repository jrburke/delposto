//Renders an HTML template to final HTML
/*jslint node: true */
'use strict';

var mustache = require('mustache'),
    fs = require('fs');

function render(template, data) {
    return mustache.render(template, data);
}

render.fromFile = function (templatePath, data) {
    return render(fs.readSync(templatePath, 'utf8'), data);
};

module.exports = render;