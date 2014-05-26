/**
 * DepsResolver
 * ============
 */

var inherit = require('inherit');
var vow = require('vow');
var vowFs = require('enb/lib/fs/async-fs');
var bevis = require('../bevis');
var generateEntityName = bevis.generateEntityName;
var copyEntityInfo = bevis.copyEntityInfo;

var modShortcuts = [
    'view',
    'skin',
    'keyset'
];

/**
 * DepsResolver — класс, раскрывающий deps'ы.
 * @name DepsResolver
 */
module.exports = inherit({

    /**
     * Конструктор.
     * @param {SourceRoot[]} sources
     */
    __constructor: function (sources, formats) {
        this._sources = sources;
        this._declarations = [];
        this._declarationIndex = {};
        this._formats = formats;
        this._formatIndex = {};
        this._formats.forEach(function (format) {
            this._formatIndex[format.getSuffix()] = format;
        }, this);
    },



    /**
     * Раскрывает шорткаты deps'а.
     * @param {String|Object} dep
     * @param {String} blockName
     * @returns {Array}
     */
    normalizeDep: function (dep, blockName) {
        var sources = this._sources;
        if (typeof dep === 'string') {
            return [{blockName: dep}];
        } else {
            function preprocessDep(subDep) {
                if (!subDep.block) {
                    subDep.block = blockName;
                }
                if (subDep.mod) {
                    (subDep.mods || (subDep.mods = {}))[subDep.mod] = subDep.val;
                }
                modShortcuts.forEach(function (shortcut) {
                    if (subDep[shortcut]) {
                        (subDep.mods || (subDep.mods = {}))[shortcut] = subDep[shortcut];
                    }
                });
                return subDep;
            }

            function buildModDecls(decl, mods) {
                if (mods) {
                    return [].concat.apply([], Object.keys(mods).map(function (modName) {
                        var modValues = mods[modName];
                        modValues = modValues === '*' ?
                            sources.getModValues(decl.blockName, modName) :
                            [].concat(modValues);
                        return modValues.map(function (modValue) {
                            var resDecl = copyEntityInfo(decl);
                            resDecl.modName = modName;
                            resDecl.modValue = modValue;
                            return resDecl;
                        });
                    }));
                } else {
                    return [copyEntityInfo(decl)]
                }
            }

            if (!dep || !(dep instanceof Object)) {
                throw new Error('Deps shoud be instance of Object or String');
            }

            dep = preprocessDep(dep);

            var decl = {blockName: dep.block};
            if (dep.elem) {
                decl.elemName = dep.elem;
            }
            var res = [];
            if (res.elems) {
                res.elems.forEach(function (elem) {
                    if (typeof elem === 'object') {
                        elem = preprocessDep(elem);
                        res = res.concat(buildModDecls(elem, elem.mods));
                    } else {
                        res = res.concat(preprocessDep({elemName: elem}))
                    }
                });
            } else {
                res = res.concat(buildModDecls(decl, dep.mods));
            }
            if (dep.required) {
                res.forEach(function (subDep) {
                    subDep.required = true;
                });
            }
            return res;
        }
    },

    /**
     * Раскрывает шорткаты для списка deps'ов.
     * @param {String|Object|Array} deps
     * @param {String} [blockName]
     * @returns {Array}
     */
    normalizeDeps: function (deps, blockName) {
        if (Array.isArray(deps)) {
            var result = [];
            for (var i = 0, l = deps.length; i < l; i++) {
                result = result.concat(this.normalizeDep(deps[i], blockName));
            }
            return result;
        } else {
            return this.normalizeDep(deps, blockName);
        }
    },

    /**
     * Возвращает deps'ы для декларации (с помощью sources).
     * @param {Object} decl
     * @returns {{deps: Array, requiredDeps: Array}}
     */
    getDeps: function (decl) {
        var _this = this;

        var files = this._sources.getFilesByDecl(
            decl.blockName, decl.elemName, decl.modName, decl.modValue
        ).filter(function (file) {
            return Boolean(this._formatIndex[file.suffix]);
        }, this);

        var requiredDeps = [];
        var requiredDepsIndex = {};

        var deps = [];
        var depsIndex = {};

        requiredDepsIndex[generateEntityName(decl)] = true;

        if (decl.modName) {
            var requiredDecls = [{blockName: decl.blockName}];
            if (decl.modValue) {
                requiredDecls.push({blockName: decl.blockName, modName: decl.modName});
            }
            if (decl.elemName) {
                requiredDecls.forEach(function (reqDecl) {
                    reqDecl.elemName = decl.elemName;
                })
            }
            requiredDecls.forEach(function (requiredDecl) {
                requiredDecl.key = generateEntityName(requiredDecl);
                requiredDepsIndex[requiredDecl.key] = true;
                requiredDeps.push(requiredDecl);
            });
        }

        function keepWorking(file) {
            return vowFs.read(file.fullname, 'utf8').then(function (depContent) {
                var depsStructure = _this._formatIndex[file.suffix].processFile(file.fullname, depContent);
                if (!Array.isArray(depsStructure)) {
                    throw new Error('Invalid deps structure.');
                }
                _this.normalizeDeps(depsStructure, decl.blockName).forEach(function (nd) {
                    var key = generateEntityName(nd);
                    var index = nd.required ? requiredDepsIndex : depsIndex;
                    var depList = nd.required ? requiredDeps : deps;
                    if (!index[key]) {
                        index[key] = true;
                        nd.key = key;
                        depList.push(nd);
                    }
                });
                if (files.length > 0) {
                    return keepWorking(files.shift());
                } else {
                    return null;
                }
            }).fail(function (err) {
                err.message += 'File "' + file.fullname + '": ' + err.message;
                throw err;
            });
        }

        var result = {requiredDeps: requiredDeps, deps: deps};

        if (files.length > 0) {
            return keepWorking(files.shift()).then(function () {
                return result;
            });
        } else {
            return vow.fulfill(result);
        }
    },

    /**
     * Добавляет декларацию в резолвер.
     * @param {Object} decl
     * @returns {Promise}
     */
    addDecl: function (decl) {
        var _this = this;
        var key = generateEntityName(decl);
        if (this._declarationIndex[key]) {
            return null;
        }
        this._declarations.push(decl);
        this._declarationIndex[key] = decl;
        return this.getDeps(decl).then(function (deps) {
            decl.key = key;
            decl.deps = {};
            decl.depCount = 0;
            return _this.addDecls(deps.requiredDeps, function (dep) {
                decl.deps[dep.key] = true;
                decl.depCount++;
            }).then(function () {
                return _this.addDecls(deps.deps);
            });
        });
    },

    /**
     * Добавляет набор деклараций.
     * @param {Array} decls
     * @returns {Promise}
     * @param {Function} [preCallback]
     */
    addDecls: function (decls, preCallback) {
        var promise = vow.fulfill();
        var _this = this;
        decls.forEach(function (decl) {
            promise = promise.then(function () {
                if (preCallback) {
                    preCallback(decl);
                }
                return _this.addDecl(decl);
            });
        });
        return promise;
    },

    /**
     * Упорядочивает deps'ы, возвращает в порядке зависимостей.
     * @returns {Array}
     */
    resolve: function () {
        var items = this._declarations.slice(0);
        var result = [];
        var hasChanges = true;
        var newItems;
        while (hasChanges) {
            newItems = [];
            hasChanges = false;
            for (var i = 0, l = items.length; i < l; i++) {
                var decl = items[i];
                if (decl.depCount === 0) {
                    hasChanges = true;
                    for (var j = 0; j < l; j++) {
                        var subDecl = items[j];
                        if (subDecl.deps[decl.key]) {
                            delete subDecl.deps[decl.key];
                            subDecl.depCount--;
                        }
                    }
                    result.push(copyEntityInfo(decl));
                } else {
                    newItems.push(decl);
                }
            }
            items = newItems;
        }
        if (items.length) {
            var errorMessage = items.map(function (item) {
                return item.key + ' <- ' + Object.keys(item.deps).join(', ');
            });
            throw Error('Unresolved deps: \n' + errorMessage.join('\n'));
        }
        return result;
    }
});
