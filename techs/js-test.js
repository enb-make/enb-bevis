/**
 * js-test
 * =======
 *
 * Формирует *test.js* на основе деклараций тестов.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий файл. По умолчанию — `?.test.js`.
 * * *RegExp|String* **fileMask** — Фильтр для тестов.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-bevis/techs/source-deps-test'));
 * ```
 */

var vow = require('vow');
var vowFs = require('enb/lib/fs/async-fs');
var File = require('enb-source-map/lib/file');

module.exports = require('enb/lib/build-flow').create()
    .name('js-test')
    .target('target', '?.test.js')
    .useFileList('test.js')
    .defineOption('useSourceMap', true)
    .defineOption('fileMask', /.*/, '_fileMask')
    .builder(function (testFiles) {
        var node = this.node;
        var destPath = node.resolvePath(this._target);
        var fileMask = this._fileMask;

        var fullnames = testFiles.map(function (item) {
            return item.fullname;
        });
        testFiles = testFiles.filter(function (item, index) {
            return fullnames.indexOf(item.fullname) === index;
        });

        testFiles = testFiles.filter(
            typeof fileMask === 'function' ? fileMask : function (file) {
            return fileMask.test(file.fullname);
        });
        return vow.all(testFiles.map(function (file) {
            return vowFs.read(file.fullname, 'utf8').then(function (content) {
                return {
                    filename: node.relativePath(file.fullname),
                    content: content
                };
            });
        })).then(function (results) {
            var file = new File(destPath, this._useSourceMap);
            results.forEach(function (result) {
                file.writeFileContent(result.filename, result.content);
            });
            return file.render();
        }.bind(this));
    })
    .createTech();
