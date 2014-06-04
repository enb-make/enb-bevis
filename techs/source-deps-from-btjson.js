/**
 * source-deps-from-btjson
 * =======================
 *
 * Формирует *deps.yaml* на основе `?.btjson.js`.
 *
 * **Опции**
 *
 * * *String* **source** — Исходный btjson-файл. По умолчанию — `?.btjson.js`.
 * * *String* **target** — Результирующий файл. По умолчанию — `?.deps.yaml`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb-bevis/techs/source-deps-from-btjson'));
 * ```
 *
 */

var asyncRequire = require('enb/lib/fs/async-require');
var dropRequireCache = require('enb/lib/fs/drop-require-cache');
var bevis = require('../lib/bevis');
var generateEntityName = bevis.generateEntityName;
var entityInfoToDep = bevis.entityInfoToDep;
var yaml = require('js-yaml');

module.exports = require('enb/lib/build-flow').create()
    .name('source-deps-from-btjson')
    .target('target', '?.deps.yaml')
    .useSourceFilename('source', '?.btjson.js')
    .builder(function (btjsonFilename) {
        dropRequireCache(require, btjsonFilename);
        return asyncRequire(btjsonFilename).then(function (json) {
            var entities = [];
            addEntitiesFromBtjson(json, entities, {}, null);
            return yaml.safeDump(entities.map(entityInfoToDep));
        });
    })
    .createTech();

function addEntitiesFromBtjson(btjson, entities, entityIndex, parentBlockName) {
    if (Array.isArray(btjson)) {
        btjson.forEach(function (bemjsonItem) {
            addEntitiesFromBtjson(bemjsonItem, entities, entityIndex, parentBlockName);
        });
    } else {
        if (btjson.block || btjson.elem) {
            if (btjson.elem && !btjson.block) {
                btjson.block = parentBlockName;
            }
            if (btjson.block) {
                var entity = {blockName: btjson.block};
                if (btjson.elem) {
                    entity.elemName = btjson.elem;
                }
                if (btjson.view && typeof btjson.view === 'string') {
                    entity.modName = 'view';
                    entity.modValue = btjson.view;
                }
                var itemKey = generateEntityName(entity);
                if (!entityIndex[itemKey]) {
                    entities.push(entity);
                    entityIndex[itemKey] = true;
                }
            }
        }
        for (var i in btjson) {
            if (btjson.hasOwnProperty(i)) {
                var value = btjson[i];
                if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                    addEntitiesFromBtjson(btjson[i], entities, entityIndex, btjson.block || parentBlockName);
                }
            }
        }
    }
}
