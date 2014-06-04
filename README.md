enb-bevis [![Build Status](https://travis-ci.org/enb-make/enb-bevis.png?branch=master)](https://travis-ci.org/enb-make/enb-bevis)
==========

Предоставляет технологии для сборки проектов на базе **BEViS**.

Сборка
------

Сборка обычного BEViS-проекта выглядит так:

**.enb/make.js:**
```javascript
    // ...
    config.node('pages/index', function (nodeConfig) {
        var browserSupport = [
            'IE >= 9',
            'Safari >= 5',
            'Chrome >= 33',
            'Opera >= 12.16',
            'Firefox >= 28'
        ];

        nodeConfig.addTechs([
            // Зависимости
            require('enb-bevis/techs/sources'),
            [require('enb-bevis/techs/deps'), {sourceDeps: 'page'}], // начинаем сборку с блока page
            require('enb-bevis/techs/files'),

            // Локализация
            [require('enb-y-i18n/techs/y-i18n-lang-js'), {lang: '{lang}'}],

            // Сборка JS
            require('enb-bt/techs/bt-client-module'),
            [require('enb-bevis/techs/js'), {lang: '{lang}', target: '?.source.{lang}.js'}],
            [require('enb-autopolyfiller/techs/autopolyfiller'), {
                source: '?.source.{lang}.js',
                target: '?.{lang}.js',
                browsers: browserSupport,
                excludes: ['Promise']
            }],

            // Сборка CSS
            [require('enb-stylus/techs/css-stylus-with-autoprefixer'), {
                browsers: browserSupport,
                variables: {
                    ie: false
                }
            }],
            [require('enb-stylus/techs/css-stylus-with-autoprefixer'), {
                browsers: ['ie 9'],
                target: '?.ie.css',
                variables: {
                    ie: 9
                }
            }],

            // Сборка HTML
            require('enb-bt/techs/bt-server'),
            [require('enb-bt/techs/html-from-btjson'), {lang: '{lang}'}]
        ]);

        nodeConfig.mode('development', function (nodeConfig) {
            nodeConfig.addTechs([
                [require('enb/techs/file-copy'), {source: '?.css', target: '_?.css'}],
                [require('enb/techs/file-copy'), {source: '?.ie.css', target: '_?.ie.css'}],
                [require('enb/techs/file-copy'), {source: '?.lang.{lang}.js', target: '_?.lang.{lang}.js'}]
            ]);
        });

        nodeConfig.mode('production', function (nodeConfig) {
            nodeConfig.addTechs([
                [require('enb-borschik/techs/borschik'), {source: '?.css', target: '_?.css', freeze: true}],
                [require('enb-borschik/techs/borschik'), {source: '?.ie.css', target: '_?.ie.css', freeze: true}],
                [require('enb-borschik/techs/borschik'), {source: '?.lang.{lang}.js', target: '_?.lang.{lang}.js'}]
            ]);
        });

        nodeConfig.addTargets([
            '_?.{lang}.js',
            '_?.css',
            '_?.ie.css',
            '?.{lang}.html'
        ]);
    });
    // ...
```

**package.json:**
```javascript
//...
"enb": {
  "dependencies": ["islets"], // зависимость от islets
  "sources": [
    "blocks" // директории для блоков проекта
  ]
}
//...
```

sources
-------

Собирает информацию о директориях с исходным кодом проекта, предоставляет `?.sources`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.sources`.
* *Boolean* **auto** — Автоматический сбор директорий с исходниками на основе `package.json`.
  По умолчанию включено.
* *String[]* **sources** — Исходные директории.
* *String[]* **dependencies** — Пакеты, от которых зависит проект.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bevis/techs/sources'));
```

deps
----

Раскрывает зависимости.

**Опции**

* *String|Array|Object* **sourceDeps** — Исходные зависимости. Можно указать сразу, чтобы не создавать файл.
* *String* **sourceDepsFile** — Файл с исходными зависимостями. По умолчанию — `?.deps.yaml`.
* *String* **sources** — Исходный sources. По умолчанию — `?.sources`.
* *String* **target** — Результирующий deps. По умолчанию — `?.dest-deps.js`.
* *String* **jsSuffixes** — Суффиксы `js`-файлов. По умолчанию — `?.deps.yaml`.

**Пример**

Обычное использование:
```javascript
nodeConfig.addTech(require('enb-bevis/techs/deps'));
```

Сборка специфического deps:
```javascript
nodeConfig.addTech([require('enb-bevis/techs/deps'), {
  sourceDepsFile: 'search.deps.yaml',
  target: 'search.dest-deps.js'
}]);
```

files
-----

Собирает список исходных файлов для сборки на основе *deps* и *sources*, предоставляет `?.files` и `?.dirs`.
Используется многими технологиями, которые объединяют множество файлов из различных исходных директорий в один.

**Опции**

* *String* **depsFile** — Исходный deps-файл. По умолчанию — `?.dest-deps.js`.
* *String* **sources** — Исходный sources. По умолчанию — `?.sources`.
* *String* **filesTarget** — Результирующий files-таргет. По умолчанию — `?.files`.
* *String* **dirsTarget** — Результирующий dirs-таргет. По умолчанию — `?.dirs`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bevis/techs/files'));
```


js
---

Собирает `{lang}.js`-файл.

**Опции**

* *String* **target** — Результирующий файл. По умолчанию — `?.{lang}.js`.
* *String* **btFile** — Файл с BT-шаблонами. По умолчанию — `?.bt-client.js`.
* *String* **i18nFile** — Файл с переводами. По умолчанию — `?.{lang}.js`.
* *String* **lang** — Язык. Нет значения по умолчанию.

**Пример**

Обычное использование:
```javascript
nodeConfig.addTech(require('enb-bevis/techs/js'), {lang: '{lang}'});
```

Использование с автополифиллером:
```javascript
nodeConfig.addTechs([
    [require('enb-bevis/techs/js'), {target: '?.source.{lang}.js', lang: '{lang}'}],
    [require('enb-autopolyfiller/techs/autopolyfiller'), {
        source: '?.source.{lang}.js',
        target: '?.{lang}.js',
        browsers: ['IE >= 9', 'Safari >= 5', 'Chrome >= 33', 'Opera >= 12.16', 'Firefox >= 28']
    }]
]);
```

source-deps-from-btjson
-----------------------

Формирует *deps.yaml* на основе `?.btjson.js`.

**Опции**

* *String* **source** — Исходный btjson-файл. По умолчанию — `?.btjson.js`.
* *String* **target** — Результирующий файл. По умолчанию — `?.deps.yaml`.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bevis/techs/source-deps-from-btjson'));
```

source-deps-test
----------------

Формирует *deps.yaml* на основе деклараций тестов.

**Опции**

* *String* **sources** — Исходный sources. По умолчанию — `?.sources`.
* *String* **target** — Результирующий файл. По умолчанию — `?.deps.yaml`.
* *RegExp|String* **fileMask** — Фильтр для тестов.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bevis/techs/source-deps-test'));
```

js-test
-------

Формирует *test.js* на основе деклараций тестов.

**Опции**

* *String* **target** — Результирующий файл. По умолчанию — `?.test.js`.
* *RegExp|String* **fileMask** — Фильтр для тестов.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bevis/techs/source-deps-test'));
```
