var vowFs = require('enb/lib/fs/async-fs');
var separatedCoverage = require('separated-coverage');
var Instrumenter = separatedCoverage.Instrumenter;
var BasenameFileSet = separatedCoverage.BasenameFileSet;

/**
 * Инструментирует JS-код тестов для coverage.
 */
module.exports = require('enb/lib/build-flow').create()
    .name('js-cov')
    .target('target', '?.js')
    .useSourceFilename('source', '?.cov.js')
    .builder(function (sourceFilename) {
        return vowFs.read(sourceFilename, 'utf8').then(function (content) {
            var instrumenter = new Instrumenter(new BasenameFileSet());
            return instrumenter.placeMochaActivators(content, sourceFilename);
        });
    })
    .createTech();
