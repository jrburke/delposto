/**
 * @license Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/volojs/volo for details
 */

/*jslint node: true */
/*global console */

'use strict';

var fs = require('fs'),
    path = require('path'),
    exists = require('./exists'),
    exec = require('child_process').exec,
    file;

function frontSlash(path) {
    return path.replace(/\\/g, '/');
}

function findMatches(matches, dir, regExpInclude, regExpExclude, dirRegExpExclude) {
    if (exists(dir) && fs.statSync(dir).isDirectory()) {
        var files = fs.readdirSync(dir);
        files.forEach(function (filePath) {
            filePath = path.join(dir, filePath);
            if (exists(filePath)) {
                var stat = fs.statSync(filePath),
                    ok = false;
                if (stat.isFile()) {
                    ok = true;
                    if (regExpInclude) {
                        ok = filePath.match(regExpInclude);
                    }
                    if (ok && regExpExclude) {
                        ok = !filePath.match(regExpExclude);
                    }

                    if (ok) {
                        matches.push(filePath);
                    }
                } else if (stat.isDirectory() && (!dirRegExpExclude || !dirRegExpExclude.test(filePath))) {
                    findMatches(matches, filePath, regExpInclude, regExpExclude, dirRegExpExclude);
                }
            }
        });
    }
}

file = {
    //Default exclusion regexp used by getFilteredFileList
    dirRegExpExclude: /\.git|\.hg|\.svn|CVS/,

    /**
     * Recurses startDir and finds matches to the files that match
     * regExpFilters.include and do not match regExpFilters.exclude.
     * Or just one regexp can be passed in for regExpFilters,
     * and it will be treated as the "include" case.
     *
     * @param {String} startDir the directory to start the search
     * @param {RegExp} regExpInclude regexp to match files to include
     * @param {RegExp} [regExpExclude] regexp to exclude files.
     * @param {RegExp} [dirRegExpExclude] regexp to exclude directories. By default
     * ignores .git, .hg, .svn and CVS directories.
     *
     * @returns {Array} List of file paths. Could be zero length if no matches.
     */
    getFilteredFileList: function (startDir, regExpInclude, regExpExclude, dirRegExpExclude) {
        var files = [];

        //By default avoid source control directories
        if (dirRegExpExclude === undefined) {
            dirRegExpExclude = file.dirRegExpExclude;
        }

        findMatches(files, startDir, regExpInclude, regExpExclude, dirRegExpExclude);

        return files;
    },

    /**
     * Reads a file, synchronously.
     * @param {String} filePath the path to the file.
     */
    read: function (filePath) {
        return fs.readFileSync(filePath, 'utf8');
    },

    write: function (filePath, contents) {
        //Make sure the parent dir exists.
        file.mkdirs(path.dirname(filePath));
        return fs.writeFileSync(filePath, contents, 'utf8');
    },

    exists: function (filePath) {
        return exists(filePath);
    },

    /**
     * Recursively creates directories in dir string.
     * @param {String} dir the directory to create.
     */
    mkdirs: function (dir) {
        dir = frontSlash(dir);

        var parts = dir.split('/'),
            currDir = '',
            first = true;

        parts.forEach(function (part) {
            //First part may be empty string if path starts with a slash.
            currDir += part + '/';
            first = false;

            if (part) {
                if (!exists(currDir)) {
                    fs.mkdirSync(currDir, 511);
                }
            }
        });
    },

    /**
     * Works on files and directories. Does not prompt just tries to delete
     * with no feedback.
     */
    rm: function (dirOrFile) {
        if (!dirOrFile || !exists((dirOrFile = path.resolve(dirOrFile)))) {
            return undefined;
        }

        if (dirOrFile === '/') {
            throw new Error('file.rm() cannot handle /');
        }

        function rm(target) {
            var stat = fs.statSync(target);
            if (stat.isDirectory()) {
                fs.readdirSync(target).forEach(function (file) {
                    rm(path.resolve(target, file));
                });
                return fs.rmdirSync(target);
            } else {
                return fs.unlinkSync(target);
            }
        }

        return rm(dirOrFile);
    },

    /**
     * Returns the first directory found inside a directory.
     * The return results is dir + firstDir name.
     */
    firstDir: function (dir) {
        var firstDir = null;

        fs.readdirSync(dir).some(function (file) {
            firstDir = path.join(dir, file);
            if (fs.statSync(firstDir).isDirectory()) {
                return true;
            } else {
                firstDir = null;
                return false;
            }
        });

        return firstDir;
    },

    copyDir: function (srcDir,
                       destDir,
                       regExpFilter,
                       onlyCopyNew,
                       regExpExclude,
                       dirRegExpExclude) {
        //summary: copies files from srcDir to destDir using the regExpFilter to determine if the
        //file should be copied. Returns a list file name strings of the destinations that were copied.
        regExpFilter = regExpFilter || /\w/;

        //Normalize th directory names, but keep front slashes.
        //path module on windows now returns backslashed paths.
        srcDir = frontSlash(path.normalize(srcDir));
        destDir = frontSlash(path.normalize(destDir));

        var i, srcFileName, destFileName,
            fileNames = file.getFilteredFileList(srcDir, regExpFilter, regExpExclude, dirRegExpExclude),
            copiedFiles = [];

        for (i = 0; i < fileNames.length; i += 1) {
            srcFileName = frontSlash(fileNames[i]);
            destFileName = srcFileName.replace(srcDir, destDir);

            if (file.copyFile(srcFileName, destFileName, onlyCopyNew)) {
                copiedFiles.push(destFileName);
            }
        }

        return copiedFiles.length ? copiedFiles : null; //Array or null
    },


    copyFile: function (srcFileName, destFileName, onlyCopyNew) {
        //summary: copies srcFileName to destFileName. If onlyCopyNew is set, it only copies the file if
        //srcFileName is newer than destFileName. Returns a boolean indicating if the copy occurred.
        var parentDir;

        //logger.trace("Src filename: " + srcFileName);
        //logger.trace("Dest filename: " + destFileName);

        //If onlyCopyNew is true, then compare dates and only copy if the src is newer
        //than dest.
        if (onlyCopyNew) {
            if (exists(destFileName) && fs.statSync(destFileName).mtime.getTime() >= fs.statSync(srcFileName).mtime.getTime()) {
                return false; //Boolean
            }
        }

        //Make sure destination dir exists.
        parentDir = path.dirname(destFileName);
        if (!exists(parentDir)) {
            file.mkdirs(parentDir);
        }

        fs.writeFileSync(destFileName, fs.readFileSync(srcFileName, 'binary'), 'binary');

        return true; //Boolean
    }
};

module.exports = file;
