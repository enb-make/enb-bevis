/**
 * deps
 * ====
 *
 * Раскрывает зависимости.
 *
 * **Опции**
 *
 * * *String* **sourceDepsFile** — Файл с исходными зависимостями. По умолчанию — `?.deps.yaml`.
 * * *String* **sources** — Исходный sources. По умолчанию — `?.sources`.
 * * *String* **target** — Результирующий deps. По умолчанию — `?.dest-deps.js`.
 * * *String* **jsSuffixes** — Суффиксы `js`-файлов. По умолчанию — `?.deps.yaml`.
 *
 * **Пример**
 *
 * Обычное использование:
 * ```javascript
 * nodeConfig.addTech(require('enb-bevis/techs/deps'));
 * ```
 *
 * Сборка специфического deps:
 * ```javascript
 * nodeConfig.addTech([require('enb-bevis/techs/deps'), {
 *   sourceDepsFile: 'search.deps.yaml',
 *   target: 'search.deps.js'
 * }]);
 * ```
 */
var vow = require('vow');
var vowFs = require('enb/lib/fs/async-fs');
var DepsResolver = require('../lib/deps/deps-resolver');
var inherit = require('inherit');
var YamlFormat = require('../lib/deps/formats/yaml');
var ModulesFormat = require('../lib/deps/formats/modules-js');
var asyncRequire = require('enb/lib/fs/async-require');
var dropRequireCache = require('enb/lib/fs/drop-require-cache');

module.exports = inherit(require('enb/lib/tech/base-tech'), {

    getName: function () {
        return 'deps';
    },

    configure: function () {
        this._target = this.node.unmaskTargetName(
            this.getOption('target', this.node.getTargetName('dest-deps.js'))
        );
        this._sourceDeps = this.getOption('sourceDeps');
        if (!this._sourceDeps) {
            this._sourceDepsFile = this.node.unmaskTargetName(
                this.getOption('sourceDepsFile', this.node.getTargetName('deps.yaml'))
            );
        }

        this._jsSuffixes = this.getOption('jsSuffixes', ['js']);

        this._sourcesFile = this.node.unmaskTargetName(
            this.getOption('sources', this.node.getTargetName('sources'))
        );
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var _this = this;
        var target = this._target;
        var targetPath = this.node.resolvePath(target);
        var cache = this.node.getNodeCache(target);

        var sourceDeps = this._sourceDeps;
        var sourceDepsFile;
        var sourceDepsFilename;
        if (!sourceDeps) {
            sourceDepsFile = this._sourceDepsFile;
            sourceDepsFilename = this.node.resolvePath(sourceDepsFile);
        }

        var sourcesToRequire = [this._sourcesFile];
        if (this._sourceDepsFile) {
            sourcesToRequire.push(this._sourceDepsFile);
        }

        var jsSuffixes = this._jsSuffixes;
        var suffixes = jsSuffixes.concat('deps.yaml');
        return this.node.requireSources(sourcesToRequire).spread(function (sources) {
            var depFiles = [].concat.apply([], suffixes.map(function (suffix) {
                return sources.getFilesBySuffix(suffix);
            }));
            if (cache.needRebuildFile('deps-file', targetPath) ||
                (sourceDepsFilename ? cache.needRebuildFile('source-file', sourceDepsFilename) : false) ||
                cache.needRebuildFileList('deps-file-list', depFiles)
            ) {
                var sourceReadPromise;

                if (sourceDeps) {
                    sourceReadPromise = vow.fulfill(sourceDeps);
                } else {
                    var format = new YamlFormat();
                    sourceReadPromise = vowFs.read(sourceDepsFilename, 'utf8').then(function (depsContent) {
                        return format.processFile(sourceDepsFilename, depsContent);
                    });
                }

                return sourceReadPromise.then(function (startingDeps) {
                    var depsResolver = new DepsResolver(sources, jsSuffixes.map(function (suffix) {
                        return new ModulesFormat(suffix);
                    }).concat(new YamlFormat()));
                    return depsResolver.addDecls(depsResolver.normalizeDeps(startingDeps)).then(function () {
                        var resolvedDeps = depsResolver.resolve();
                        return vowFs.write(
                            targetPath, 'module.exports = ' + JSON.stringify(resolvedDeps, null, 4) + ';\n', 'utf8'
                        ).then(function () {
                                cache.cacheFileInfo('deps-file', targetPath);
                                if (sourceDepsFilename) {
                                    cache.cacheFileInfo('source-file', sourceDepsFilename);
                                }
                                cache.cacheFileList('deps-file-list', depFiles);
                                _this.node.resolveTarget(target, resolvedDeps);
                            });
                    });
                });
            } else {
                dropRequireCache(require, targetPath);
                return asyncRequire(targetPath).then(function (value) {
                    _this.node.isValidTarget(target);
                    _this.node.resolveTarget(target, value);
                });
            }
        });
    }
});
