//Renders an HTML template to final HTML
/*jslint node: true */
'use strict';

var mustache = require('mustache'),
    fs = require('fs');

function render(template, data, partials) {
    return mustache.render(template, data, partials);
}

render.fromFile = function (templatePath, data, partials) {
    return render(fs.readFileSync(templatePath, 'utf8'), data, partials);
};

module.exports = render;