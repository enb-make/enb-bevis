var inherit = require('inherit');
var bevis = require('../../bevis');
var parseEntityName = bevis.parseEntityName;
var entityInfoToDep = bevis.entityInfoToDep;

var MODULES_REGEXP = /modules\.(?:define|require)\((?:[\s\n\r]*['"][^"']+["'][\s\n\r]*,)?[\s\n\r]*(?:\[([^\]]+)?\])?/g;
var ES6_MODULES_REGEXP = /^import\s+(\*\s+as\s+)?\w.*[\s\n]+from\s+['"]([^'"]+)['"]/gm;

module.exports = inherit({
    /**
     * @param {String} suffix
     */
    __constructor: function (suffix) {
        this._suffix = suffix || 'js';
    },

    getSuffix: function () {
        return this._suffix;
    },

    processFile: function (filename, fileContent) {
        var modules = [];

        var es5Matches = ES6_MODULES_REGEXP.exec(fileContent);
        while (es5Matches !== null) {
            if (es5Matches[2]) {
                modules.push(es5Matches[2]);
            }
            es5Matches = ES6_MODULES_REGEXP.exec(fileContent);
        }

        var matches = MODULES_REGEXP.exec(fileContent);
        if (matches === null) {
            return modules;
        }

        while (matches !== null) {
            if (matches[1]) {
                modules = modules.concat(matches[1].split(',').map(function (s) {
                    var dependency = s.replace(/^[^\'"]*['"]|['"][^\'"]*$/g, '');
                    return entityInfoToDep(parseEntityName(dependency));
                }));
            }
            matches = MODULES_REGEXP.exec(fileContent);
        }

        return modules;
    }
});
