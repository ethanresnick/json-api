"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

_Object$defineProperty(exports, "__esModule", {
  value: true
});

var VALID_ORG_RESOURCE_NO_ID = {
  "type": "organizations",
  "attributes": {
    "name": "Test Organization"
  },
  "relationships": {
    "liaisons": {
      "data": [{ "type": "people", "id": "53f54dd98d1e62ff12539db3" }]
    }
  }
};

exports.VALID_ORG_RESOURCE_NO_ID = VALID_ORG_RESOURCE_NO_ID;
var VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER = _Object$assign({ "extraMember": true }, VALID_ORG_RESOURCE_NO_ID);

exports.VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER = VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER;
var ORG_RESOURCE_CLIENT_ID = _Object$assign({ "id": "53f54dd98d1e62ff12539db3" }, VALID_ORG_RESOURCE_NO_ID);
exports.ORG_RESOURCE_CLIENT_ID = ORG_RESOURCE_CLIENT_ID;