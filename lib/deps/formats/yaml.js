var inherit = require('inherit');
var yaml = require('js-yaml');

module.exports = inherit({
    getSuffix: function () {
        return 'deps.yaml';
    },

    processFile: function (filename, content) {
        var depYamlStructure = yaml.safeLoad(content, {
            filename: filename,
            strict: true
        });
        if (!Array.isArray(depYamlStructure)) {
            throw new Error('Invalid yaml deps structure.');
        }
        return depYamlStructure;
    }
});
