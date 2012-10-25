//Renders an HTML template to final HTML
/*jslint node: true */
'use strict';

var templateEngine,
    fs = require('fs'),
    codeRegExp = /<code\s+class="(html|javascript|css)">/g,
    prismLang = {
        javascript: 'javascript',
        css: 'css',
        html: 'markup'
    };

function loadTemplateEngine(engine) {
    if (!templateEngine) {
        templateEngine = require('./render/' + render.getTemplateType(engine || 'mustache').type);
    }
    return templateEngine;
}

function render(template, data, meta) {
    loadTemplateEngine(meta.data.templateEngine);

    //Convert to HTML, and change any code blocks to use language- for prism.
    return templateEngine(template, data).replace(codeRegExp, function (match, lang) {
        return '<code class="language-' + prismLang[lang] + '">';
    });
}

render.fromFile = function (templatePath, data) {
    return render(fs.readFileSync(templatePath, 'utf8'), data);
};

render.getTemplateType = function (engine) {
    //Given a string (generally from meta.data.templateEngine defining the template
    //engine, return an object containing string IDs for the module to load and
    //the field in the `templates` module in which we'll find our loaded template(s)
    if (engine && engine.toLowerCase() == 'jade') {
        return {type: 'jade', template: 'index_jade', fileType: 'jade'};
    } else {
        return {type: 'mustache', template: 'index_html', fileType: 'html'};
    }
};

module.exports = render;
