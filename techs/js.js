/**
 * js
 * ===
 *
 * Собирает `{lang}.js`-файл.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий файл. По умолчанию — `?.{lang}.js`.
 * * *String* **btFile** — Файл с BT-шаблонами. По умолчанию — `?.bt-client.js`.
 * * *String* **i18nFile** — Файл с переводами. По умолчанию — `?.{lang}.js`.
 * * *String* **lang** — Язык. Нет значения по умолчанию.
 * * *Boolean* **freezeLinks** — Нужно ли замораживать ссылки внтри файлов. По умолчанию — `false`.
 *
 * **Пример**
 *
 * Обычное использование:
 * ```javascript
 * nodeConfig.addTech(require('enb-bevis/techs/js'), {lang: '{lang}'});
 * ```
 *
 * Использование с автополифиллером:
 * ```javascript
 * nodeConfig.addTechs([
 *     [require('enb-bevis/techs/js'), {target: '?.source.{lang}.js', lang: '{lang}'}],
 *     [require('enb-autopolyfiller/techs/autopolyfiller'), {
 *         source: '?.source.{lang}.js',
 *         target: '?.{lang}.js',
 *         browsers: ['IE >= 9', 'Safari >= 5', 'Chrome >= 33', 'Opera >= 12.16', 'Firefox >= 28']
 *     }]
 * ]);
 * ```
 */

var vow = require('vow');
var vowFs = require('enb/lib/fs/async-fs');
var File = require('enb-source-map/lib/file');
var BorschikPreprocessor = require('enb-borschik/lib/borschik-preprocessor');

module.exports = require('enb/lib/build-flow').create()
    .name('js')
    .target('target', '?.{lang}.js')
    .useFileList(['js'])
    .defineOption('freezeLinks', false)
    .defineOption('useSourceMap', true)
    .useSourceFilename('i18nFile', '?.lang.{lang}.js')
    .useSourceFilename('btFile', '?.bt.client.js')
    .builder(function (jsFiles, i18nFile, btFile) {
        var node = this.node;
        var destPath = node.resolvePath(this._target);

        var tasks = [__dirname + '/../node_modules/ym/modules.js'];
        jsFiles.forEach(function (fileInfo) {
            if (tasks.indexOf(fileInfo.fullname) === -1) {
                tasks.push(fileInfo.fullname);
            }
        });
        tasks.push(btFile);
        tasks.push(i18nFile);

        var freezeLinks = this._freezeLinks;
        return vow.all(tasks.map(function (filePath, index) {
            if (!freezeLinks) {
                return vowFs.read(filePath, 'utf8').then(function (content) {
                    return {
                        name: node.relativePath(filePath),
                        content: content
                    };
                });
            }

            return node.createTmpFileForTarget('#' + index).then(function (tmpFile) {
                return new BorschikPreprocessor()
                    .preprocessFile(filePath, tmpFile, true, false, false)
                    .then(function () {
                        return vowFs.read(tmpFile, 'utf8');
                    })
                    .then(function (content) {
                        return vowFs.remove(tmpFile).then(function () {
                            return {
                                name: node.relativePath(filePath),
                                content: content
                            };
                        });
                    });
            });
        })).then(function (results) {
            var file = new File(destPath, this._useSourceMap);
            results.forEach(function (result) {
                file.writeFileContent(result.name, result.content);
            });
            return file.render();
        }.bind(this));
    })
    .createTech();
