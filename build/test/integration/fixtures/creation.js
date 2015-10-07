"use strict";

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

Object.defineProperty(exports, "__esModule", {
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
var VALID_SCHOOL_RESOURCE_NO_ID = {
  "type": "schools",
  "attributes": {
    "name": "Test School"
  }
};

exports.VALID_SCHOOL_RESOURCE_NO_ID = VALID_SCHOOL_RESOURCE_NO_ID;
var INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP = {
  "type": "organizations",
  "relationships": {
    "liaisons": {
      "type": "people", "id": "53f54dd98d1e62ff12539db3"
    }
  }
};
exports.INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP = INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP;