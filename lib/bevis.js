/**
 * @typedef {Object} BevisEntityInfo
 * @property {String} blockName
 * @property {String|Null} elemName
 * @property {String|Null} modName
 * @property {String|Null} modValue
 * @property {String|Null} suffix
 */

module.exports = {
    /**
     * @returns {BevisEntityInfo}
     */
    parseEntityName: function (entityName) {
        var entityNameBits = entityName.split('.');
        var entityBaseName = entityNameBits.shift();
        var suffix = entityNameBits.join('.');

        var blockName;
        var elemName;
        if (entityBaseName.indexOf('__') !== -1) {
            var elemBits = entityBaseName.split('__');
            blockName = elemBits.shift();
            elemBits = elemBits.shift().split('_');
            elemName = elemBits.shift();
            entityBaseName = elemBits.join('_');
        } else {
            var blockBits = entityBaseName.split('_');
            blockName = blockBits.shift();
            entityBaseName = blockBits.join('_');
        }

        var modName;
        var modVal;
        if (entityBaseName) {
            var modParts = entityBaseName.split('_');
            if (modParts.length === 1) {
                modName = 'view';
                modVal = modParts.shift();
            } else {
                modName = modParts.shift();
                modVal = modParts.shift();
            }
        }

        return {
            blockName: blockName,
            elemName: elemName || undefined,
            modName: modName || undefined,
            modVal: modVal || undefined,
            suffix: suffix || undefined
        };
    }
};
