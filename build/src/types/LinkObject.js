"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var LinkObject = (function () {
  function LinkObject(linkage, relatedURI, selfURI) {
    _classCallCheck(this, LinkObject);

    var _ref = [linkage, relatedURI, selfURI];

    var _ref2 = _slicedToArray(_ref, 3);

    this.linkage = _ref2[0];
    this.relatedURI = _ref2[1];
    this.selfURI = _ref2[2];
  }

  _createClass(LinkObject, {
    empty: {
      value: function empty() {
        this.linkage.empty();
      }
    }
  });

  return LinkObject;
})();

module.exports = LinkObject;