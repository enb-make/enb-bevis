var inherit = require('inherit');
var bevis = require('../../bevis');
var parseEntityName = bevis.parseEntityName;
var entityInfoToDep = bevis.entityInfoToDep;

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
        var modulesDefinition = fileContent.match(
            /modules\.(?:define|require)\((?:[\s\n\r]*['"][^"']+["'][\s\n\r]*,)?[\s\n\r]*(?:\[([^\]]+)?\])?/
        );
        if (modulesDefinition && modulesDefinition[1]) {
            return modulesDefinition[1]
                .split(',')
                .map(function(s) {
                    return s.trim().replace(/^['"]|['"]$/g, '');
                })
                .map(function (textDependency) {
                    return entityInfoToDep(parseEntityName(textDependency));
                });
        } else {
            return [];
        }
    }
});
