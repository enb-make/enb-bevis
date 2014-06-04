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
        var suffix = entityNameBits.join('.') || undefined;

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
        var modValue;
        if (entityBaseName) {
            var modParts = entityBaseName.split('_');
            if (modParts.length === 1) {
                modName = 'view';
                modValue = modParts.shift();
                if (modValue === 'view') {
                    modValue = '';
                }
            } else {
                modName = modParts.shift();
                modValue = modParts.shift();
            }
        }

        return {
            blockName: blockName,
            elemName: elemName,
            modName: modName,
            modValue: modValue,
            suffix: suffix
        };
    },

    /**
     * @param {BevisEntityInfo} entityInfo
     */
    generateEntityName: function (entityInfo) {
        return entityInfo.blockName +
            (entityInfo.elemName ? '__' + entityInfo.elemName : '') +
            (entityInfo.modName ?
                '_' + entityInfo.modName + (entityInfo.modValue ? '_' + entityInfo.modValue : '') :
                ''
            ) +
            (entityInfo.suffix ? '.' + entityInfo.suffix : '');

    },

    /**
     * @param {BevisEntityInfo} entityInfo
     * @returns {{block: String, elem: String, mod: String, val: String}}
     */
    entityInfoToDep: function (entityInfo) {
        var result = {block: entityInfo.blockName};
        if (entityInfo.elemName) {
            result.elem = entityInfo.elemName;
        }
        if (entityInfo.modName) {
            result.mod = entityInfo.modName;
            result.val = entityInfo.modVal;
        }
        return result;
    },

    /**
     * @param {BevisEntityInfo} entityInfo
     * @returns {BevisEntityInfo}
     */
    copyEntityInfo: function (entityInfo) {
        var result = {};
        result.blockName = entityInfo.blockName;
        if (entityInfo.elemName) {
            result.elemName = entityInfo.elemName;
        }
        if (entityInfo.modName) {
            result.modName = entityInfo.modName;
        }
        if (entityInfo.modValue) {
            result.modValue = entityInfo.modValue;
        }
        return result;
    }

};
