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

function render(template, data, meta) {
//console.log(JSON.stringify({template:template, data:data, meta:meta}));
    var module;
    if (!templateEngine) {
        switch (meta.data.templateEngine && meta.data.templateEngine.toLowerCase()) {
            case "jade":
                module = "jade";
                break;
            case "mustache":
            default:
                module = "mustache";
        }

        templateEngine = require("./render/" + module);
    }

    //Convert to HTML, and change any code blocks to use language- for prism.
    return templateEngine(template, data).replace(codeRegExp, function (match, lang) {
        return '<code class="language-' + prismLang[lang] + '">';
    });
}

render.fromFile = function (templatePath, data) {
    return render(fs.readFileSync(templatePath, 'utf8'), data);
};

module.exports = render;
