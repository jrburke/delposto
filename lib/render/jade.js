//Renders an HTML template to final HTML
/*jslint node: true */
'use strict';

var jade = require('jade');

function render(template, data) {
    //Convert to HTML
    var compiled = jade.compile(template, {locals: data, pretty: true});
    return compiled(data);
}

module.exports = render;
