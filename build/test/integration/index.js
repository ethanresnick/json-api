"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _chai = require("chai");

var _appAgent = require("../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

var _appDatabase = require("../app/database");

var _appDatabase2 = _interopRequireDefault(_appDatabase);

/*
beforeEach((done) => {
  Db.then((module) => {
    module.fixturesReset().then((data) => {
      done();
    }).done();
  });
});*/

// Trigger other tests

var _contentNegotiation = require("./content-negotiation");

var _contentNegotiation2 = _interopRequireDefault(_contentNegotiation);

var _fetchCollection = require("./fetch-collection");

var _fetchCollection2 = _interopRequireDefault(_fetchCollection);

var _createResource = require("./create-resource");

var _createResource2 = _interopRequireDefault(_createResource);

process.env.TESTING = true;

_q2["default"].longStackSupport = true;