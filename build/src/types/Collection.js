"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Collection = (function () {
  function Collection(resources) {
    _classCallCheck(this, Collection);

    this.resources = resources;
  }

  _createClass(Collection, {
    ids: {
      get: function () {
        return this.resources.map(function (it) {
          return it.id;
        });
      }
    },
    types: {
      get: function () {
        return this.resources.map(function (it) {
          return it.type;
        });
      }
    }
  });

  return Collection;
})();

module.exports = Collection;