//Renders an HTML template to final HTML
/*jslint node: true */
'use strict';

var partials,
    mustache = require('mustache'),
    fs = require('fs'),
    path = require('path'),
    file = require('./file'),
    codeRegExp = /<code\s+class="(html|javascript|css)">/g,
    prismLang = {
        javascript: 'javascript',
        css: 'css',
        html: 'markup'
    };

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
    //Convert to HTML, and change any code blocks to use language- for prism.
    return mustache.render(template, data, partials).replace(codeRegExp, function (match, lang) {
        return '<code class="language-' + prismLang[lang] + '">';
    });
}

render.fromFile = function (templatePath, data) {
    return render(fs.readFileSync(templatePath, 'utf8'), data);
};

module.exports = render;