//Renders an HTML template to final HTML
/*jslint node: true */
'use strict';

var jade = require('jade'),
    fs = require('fs'),
    templates = require('../templates');

function render(template, data) {
    var html,
        tempFileName = templates.templateDir + '/__temp__.jade';

    //we create a fake filename sitting at the template directory root to allow
    //templates to do, e.g., 'include partials/head' consistently no matter where
    //the actual template is in the directory hierarchy
    fs.writeFileSync(tempFileName, template);

    //Convert to HTML
    html = (jade.compile(template, {
        filename: tempFileName,
        locals: data
    }))(data);

    fs.unlinkSync(tempFileName);

    return html;
}

module.exports = render;
