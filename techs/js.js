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

module.exports = require('enb/lib/build-flow').create()
    .name('js')
    .target('target', '?.{lang}.js')
    .useFileList(['js'])
    .useSourceFilename('i18nFile', '?.lang.{lang}.js')
    .useSourceFilename('btFile', '?.bt-client.js')
    .builder(function (jsFiles, i18nFile, btFile) {
        var node = this.node;
        var destPath = node.resolvePath(this._target);

        var tasks = [__dirname + '/../node_modules/ym/modules.js'];
        jsFiles.forEach(function (fileInfo) {
            tasks.push(fileInfo.fullname);
        });
        tasks.push(btFile);
        tasks.push(i18nFile);

        return vow.all(tasks.map(function (filePath) {
            return vowFs.read(filePath, 'utf8').then(function (content) {
                return {
                    filename: node.relativePath(filePath),
                    content: content
                };
            });
        })).then(function (results) {
            var file = new File(destPath, true);
            results.forEach(function (result) {
                file.writeFileContent(result.filename, result.content);
            });
            return file.render();
        });
    })
    .createTech();
