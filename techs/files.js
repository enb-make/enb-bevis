/**
 * files
 * =====
 *
 * Собирает список исходных файлов для сборки на основе *deps* и *sources*, предоставляет `?.files` и `?.dirs`.
 * Используется многими технологиями, которые объединяют множество файлов из различных уровней переопределения в один.
 *
 * **Опции**
 *
 * * *String* **depsFile** — Исходный deps-файл. По умолчанию — `?.deps.js`.
 * * *String* **sources** — Исходный sources. По умолчанию — `?.sources`.
 * * *String* **filesTarget** — Результирующий files-таргет. По умолчанию — `?.files`.
 * * *String* **dirsTarget** — Результирующий dirs-таргет. По умолчанию — `?.dirs`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-bevis/techs/files'));
 * ```
 */
var FileList = require('enb/lib/file-list');
var inherit = require('inherit');

module.exports = inherit(require('enb/lib/tech/base-tech'), {
    configure: function () {
        this._depsFile = this.node.unmaskTargetName(this.getOption('depsFile', '?.dest-deps.js'));
        this._sourcesFile = this.node.unmaskTargetName(this.getOption('sources', '?.sources'));
        this._filesTarget = this.node.unmaskTargetName(this.getOption('filesTarget', '?.files'));
        this._dirsTarget = this.node.unmaskTargetName(this.getOption('dirsTarget', '?.dirs'));
    },
    getName: function () {
        return 'files';
    },
    getTargets: function () {
        return [
            this._filesTarget,
            this._dirsTarget
        ];
    },
    build: function () {
        var _this = this;
        var filesTarget = this._filesTarget;
        var dirsTarget = this._dirsTarget;
        return this.node.requireSources([this._depsFile, this._sourcesFile])
            .spread(function (dependencies, sources) {
                var files = new FileList();
                var dirs = new FileList();
                dependencies.forEach(function (dep) {
                    var entities;
                    if (dep.elemName) {
                        entities = sources.getElemEntities(dep.blockName, dep.elemName, dep.modName, dep.modVal);
                    } else {
                        entities = sources.getBlockEntities(dep.blockName, dep.modName, dep.modVal);
                    }
                    files.addFiles(entities.files);
                    dirs.addFiles(entities.dirs);
                });
                _this.node.resolveTarget(filesTarget, files);
                _this.node.resolveTarget(dirsTarget, dirs);
            });
    },

    clean: function () {}
});
