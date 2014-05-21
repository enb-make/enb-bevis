/**
 * sources
 * =======
 *
 * Собирает информацию о директориях с исходным кодом проекта, предоставляет `?.levels`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.levels`.
 * * *(Boolean)[]* **auto** — Уровни переопределения. Полные пути к папкам с уровнями переопределения.
 * * *(String)[]* **sources** — Исходные директории.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb-bevis/techs/sources'), {
 *   sources: [
 *     'blocks'
 *   ].map(function (sourcePath) { return config.resolvePath(sourcePath); })
 * } ]);
 * ```
 */
var fs = require('fs');
var SourceRoot = require('enb/lib/sources/source-root');
var Sources = require('enb/lib/levels/levels');
var inherit = require('inherit');
var path = require('path');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    getName: function () {
        return 'sources';
    },

    init: function () {
        this.__base.apply(this, arguments);
        this._sources = this.getOption('sources');
        var auto = this.getOption('auto');
        this._auto = typeof auto === 'boolean' ? auto : false;
        this._target = this.node.unmaskTargetName(this.getOption('target', '?.levels'));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var sourceList = [];
        var projectRoot = this.node.getRootDir();
        var packagesDirectory = projectRoot + '/node_modules';

        function readPackageSources (packageDir) {
            var sources = [];
            var packageJsonFilename = packageDir + '/package.json';
            if (fs.existsSync(packageJsonFilename)) {
                var jsonData;
                try {
                    jsonData = JSON.parse(fs.readFileSync(packageJsonFilename));
                } catch (e) {
                    e.message = 'Error parsing "' + packageJsonFilename + '": ' + e.message;
                    throw e;
                }
                if (jsonData.enb) {
                    var enb = jsonData.enb;
                    if (enb.sources) {
                        sources = sources.concat(enb.sources.map(function (sourceName) {
                            return packageDir + '/' + sourceName;
                        }));
                    }
                    if (enb.dependencies) {
                        enb.dependencies.forEach(function (packageName) {
                            sources = sources.concat(readPackageSources(packagesDirectory + '/' + packageName));
                        });
                    }
                }
            }
        }

        if (this._auto) {
            sourceList = sourceList.concat(readPackageSources(projectRoot));
        }

        if (this._sources) {
            sourceList = sourceList.concat(this._sources.map(function (sourcePath) {
                return path.resolve(projectRoot, sourcePath);
            }));
        }

        var sourceIndex = {};
        var sourcePaths = [];
        sourceList.forEach(function (sourcePath) {
            if (!sourceIndex[sourcePath]) {
                sourceIndex[sourcePath] = true;
                sourcePaths.push(sourcePath);
            }
        });

        var sourceRoots = sourcePaths.map(function (sourcePath) {
            if (!this.node.buildState[sourcePath]) {
                this.node.buildState[sourcePath] = SourceRoot.loadFromDirectory(sourcePath);
            }
            return this.node.buildState[sourcePath];
        }, this);

        this.node.resolveTarget(this._target, new Sources(sourceRoots));
    },

    clean: function () {}
});
