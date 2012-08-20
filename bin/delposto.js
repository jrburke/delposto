#!/usr/bin/env node

/**
 * @license Copyright (c) 2012, James Burke All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/delposto for details
 */

/*jslint node: true */
'use strict';

var args = [].splice.call(process.argv, 2);

(require('../delposto'))(args);