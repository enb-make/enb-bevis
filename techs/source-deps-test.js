/**
 * source-deps-test
 * ================
 *
 * Формирует *deps.yaml* на основе деклараций тестов.
 *
 * **Опции**
 *
 * * *String* **sources** — Исходный sources. По умолчанию — `?.sources`.
 * * *String* **target** — Результирующий файл. По умолчанию — `?.deps.yaml`.
 * * *RegExp|String* **fileMask** — Фильтр для тестов.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-bevis/techs/source-deps-test'));
 * ```
 */

var inherit = require('inherit');
var vowFs = require('enb/lib/fs/async-fs');
var yaml = require('js-yaml');
var bevis = require('../lib/bevis');
var parseEntityName = bevis.parseEntityName;
var entityInfoToDep = bevis.entityInfoToDep;

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'source-deps-test';
    },

    configure: function () {
        this._target = this.node.unmaskTargetName(this.getOption('target', '?.deps.yaml'));
        this._sources = this.node.unmaskTargetName(this.getOption('sources', '?.sources'));
        this._fileMask = this.getOption('fileMask', /.*/);
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var _this = this;
        var filterFunction = typeof this._fileMask === 'function' ? this._fileMask : function (file) {
            return _this._fileMask.test(file.fullname);
        };

        var target = this._target;
        var targetPath = this.node.resolvePath(target);
        var cache = this.node.getNodeCache(target);

        return this.node.requireSources([this._sources]).spread(function (sources) {
            var sourceFiles = sources.getFilesBySuffix('test.js');
            sourceFiles = sourceFiles.filter(filterFunction);
            if (cache.needRebuildFile('target-file', targetPath) ||
                cache.needRebuildFileList('source-files', sourceFiles)
            ) {
                var deps = sourceFiles.map(function (file) {
                    return entityInfoToDep(parseEntityName(file.name));
                });

                return vowFs.write(targetPath, yaml.safeDump(deps)).then(function () {
                    cache.cacheFileInfo('target-file', targetPath);
                    cache.cacheFileList('source-files', sourceFiles);
                    _this.node.resolveTarget(target);
                });
            } else {
                _this.node.isValidTarget(target);
                _this.node.resolveTarget(target);
                return null;
            }
        });
    }
});
