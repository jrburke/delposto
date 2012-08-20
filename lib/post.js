var file = require('./file'),
    yaml = require('yaml');

function post(contents) {
    contents = contents || '';

    var headers = {},
        tildeIndex = contents.indexOf('~');

    //Separate out headers.
    if (tildeIndex !== -1) {
        headers = contents.substring(0, tildeIndex);
        headers = yaml.eval(headers);
        contents = contents.substring(tileIndex + 1, contents.length);
    }


}

post.fromFile = function (path) {
    return post(file.read(path));
};

module.exports = post;