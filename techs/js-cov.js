var vowFs = require('enb/lib/fs/async-fs');
var separatedCoverage = require('separated-coverage');
var Instrumenter = separatedCoverage.Instrumenter;
var BasenameFileSet = separatedCoverage.BasenameFileSet;

/**
 * Инструментирует JS-код для coverage.
 */
module.exports = require('enb/lib/build-flow').create()
    .name('js-cov')
    .target('target', '?.js')
    .useSourceFilename('source', '?.cov.js')
    .defineOption('excludes', [])
    .builder(function (sourceFilename) {
        return vowFs.read(sourceFilename, 'utf8').then(function (content) {
            var instrumenter = new Instrumenter(new BasenameFileSet());
            this._excludes.forEach(function (exclude) {
                instrumenter.addExclude(exclude)
            });
            return instrumenter.instrument(content, sourceFilename);
        }.bind(this));
    })
    .createTech();
