enb-bevis [![Build Status](https://travis-ci.org/enb-make/enb-bevis.png?branch=master)](https://travis-ci.org/enb-make/enb-bevis)
==========

Предоставляет технологии для сборки проектов на базе **BEViS**.

sources
-------

Собирает информацию о директориях с исходным кодом проекта, предоставляет `?.levels`.

**Опции**

* *String* **target** — Результирующий таргет. По умолчанию — `?.levels`.
* *Boolean* **auto** — Автоматический сбор директорий с исходниками на основе `package.json`.
  По умолчанию включено.
* *String[]* **sources** — Исходные директории.

**Пример**

```javascript
nodeConfig.addTech(require('enb-bevis/techs/sources'));
```
