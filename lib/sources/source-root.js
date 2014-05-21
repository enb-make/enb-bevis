/**
 * SourceRoot
 * ==========
 */
var inherit = require('inherit');
var fs = require('fs');
var parseEntityName = require('../bevis').parseEntityName;

/**
 * SourceRoot — объектная модель директории с исходными файлами.
 * @name SourceRoot
 */
module.exports = inherit({

    /**
     * @param {Object} [data]
     * @private
     */
    __constructor: function (data) {
        this._blocks = data || {};
    },

    /**
     * Загружает из кэша.
     */
    loadFromCache: function (data) {
        this._blocks = data;
    },

    /**
     * Добавляет декларацию файла.
     * @param {String} filename
     * @param {String} blockName
     * @param {String} elemName
     * @param {String} modName
     * @param {String} modVal
     */
    addFile: function (filename, blockName, elemName, modName, modVal) {
        var baseName = filename.split('/').slice(-1)[0];
        var baseNameParts = baseName.split('.');
        var stat = fs.statSync(filename);
        var suffix = baseNameParts.slice(1).join('.');
        var fileInfo = {
            name: baseName,
            fullname: filename,
            suffix: suffix,
            mtime: stat.mtime.getTime(),
            isDirectory: stat.isDirectory()
        };
        if (fileInfo.isDirectory) {
            fileInfo.files = filterHiddenFiles(fs.readdirSync(filename)).map(function (subFilename) {
                var subFullname = filename + '/' + subFilename;
                var subStat = fs.statSync(subFullname);
                return {
                    name: subFilename,
                    fullname: subFullname,
                    suffix: subFilename.split('.').slice(1).join('.'),
                    mtime: subStat.mtime.getTime(),
                    isDirectory: subStat.isDirectory()
                };
            });
        }

        var block = this._blocks[blockName] || (this._blocks[blockName] = {
            name: blockName,
            files: [],
            dirs: [],
            elements: {},
            mods: {}
        });
        var destElement;
        if (elemName) {
            destElement = block.elements[elemName] || (block.elements[elemName] = {
                name: elemName,
                files: [],
                dirs: [],
                mods: {}
            });
        } else {
            destElement = block;
        }
        var collectionKey = fileInfo.isDirectory ? 'dirs' : 'files';
        if (modName) {
            var mod = destElement.mods[modName] || (destElement.mods[modName] = {});
            var modValueFiles = (mod[modVal] || (mod[modVal] = {files: [], dirs: []}))[collectionKey];
            modValueFiles.push(fileInfo);
        } else {
            destElement[collectionKey].push(fileInfo);
        }
    },

    /**
     * Возвращает структуру блоков.
     * @returns {Object}
     */
    getBlocks: function () {
        return this._blocks;
    }
}, {
    loadFromDirectory: function (path) {
        var sourceRoot = new SourceRoot();
        addFiles(path, sourceRoot);
        return sourceRoot;
    },

    loadFromCache: function (data) {
        return new SourceRoot(data);
    }
});

function addFiles(directory, sourceRoot) {
    filterHiddenFiles(fs.readdirSync(directory)).forEach(function (filename) {
        var fullname = directory + '/' + filename;
        var stat = fs.statSync(fullname);
        var entityInfo;
        if (stat.isDirectory()) {
            if (filename.indexOf('.') !== -1) {
                entityInfo = parseEntityName(filename);
                sourceRoot.addFile(
                    fullname,
                    entityInfo.blockName,
                    entityInfo.elemName,
                    entityInfo.modName,
                    entityInfo.modVal
                );
            } else {
                addFiles(fullname, sourceRoot);
            }
        } else {
            entityInfo = parseEntityName(filename);
            sourceRoot.addFile(
                fullname,
                entityInfo.block,
                entityInfo.elem,
                entityInfo.modName,
                entityInfo.modVal
            );
        }
    });
}

function filterHiddenFiles(filenames) {
    return filenames.filter(function (filename) {
        return filename.charAt(0) !== '.';
    });
}
