//Renders an HTML template to final HTML
/*jslint node: true */
'use strict';

var jade = require('jade');

function render(template, data) {
    //Convert to HTML
    return jade.compile(template, data);
}

module.exports = render;
