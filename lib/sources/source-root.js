/**
 * SourceRoot
 * ==========
 */
var inherit = require('inherit');
var fs = require('fs');
var parseEntityName = require('../bevis').parseEntityName;
var path = require('path');

/**
 * SourceRoot — объектная модель директории с исходными файлами.
 * @name SourceRoot
 */
var SourceRoot = module.exports = inherit({
    /**
     * @param {Object} [data]
     * @private
     */
    __constructor: function (data) {
        this._blocks = data || {};
    },

    /**
     * Добавляет декларацию файла.
     * @param {String} filename
     * @param {String} blockName
     * @param {String} elemName
     * @param {String} modName
     * @param {String} modValue
     */
    addFile: function (filename, blockName, elemName, modName, modValue) {
        var fileInfo = buildFileInfo(filename);
        if (fileInfo.isDirectory) {
            fileInfo.files = filterHiddenFiles(fs.readdirSync(filename)).map(function (subFilename) {
                return buildFileInfo(filename + '/' + subFilename);
            });
        }
        var block = this._blocks[blockName] || (this._blocks[blockName] = {
            name: blockName, files: [], dirs: [], elements: {}, mods: {}
        });
        var destElement;
        if (elemName) {
            destElement = block.elements[elemName] || (block.elements[elemName] = {
                name: elemName, files: [], dirs: [], mods: {}
            });
        } else {
            destElement = block;
        }
        var collectionKey = fileInfo.isDirectory ? 'dirs' : 'files';
        if (modName) {
            var mod = destElement.mods[modName] || (destElement.mods[modName] = {});
            var modValueFiles = (mod[modValue] || (mod[modValue] = {files: [], dirs: []}))[collectionKey];
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
    loadFromPath: function (sourcePath) {
        var sourceRoot = new SourceRoot();
        if (fs.statSync(sourcePath).isDirectory()) {
            addFiles(sourcePath, sourceRoot);
        } else {
            var entityInfo = parseEntityName(path.basename(sourcePath));
            sourceRoot.addFile(
                sourcePath,
                entityInfo.blockName,
                entityInfo.elemName,
                entityInfo.modName,
                entityInfo.modValue
            );
        }
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
                    entityInfo.modValue
                );
            } else {
                addFiles(fullname, sourceRoot);
            }
        } else {
            entityInfo = parseEntityName(filename);
            sourceRoot.addFile(
                fullname,
                entityInfo.blockName,
                entityInfo.elemName,
                entityInfo.modName,
                entityInfo.modValue
            );
        }
    });
}

function filterHiddenFiles(filenames) {
    return filenames.filter(function (filename) {
        return filename.charAt(0) !== '.';
    });
}

function extractSuffix(filename) {
    return filename.split('.').slice(1).join('.');
}

function buildFileInfo(filename) {
    var baseName = filename.split('/').slice(-1)[0];
    var stat = fs.statSync(filename);
    return {
        name: baseName,
        fullname: filename,
        suffix: extractSuffix(baseName),
        mtime: stat.mtime.getTime(),
        isDirectory: stat.isDirectory()
    };
}
