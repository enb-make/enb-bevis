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
