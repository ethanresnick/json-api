"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _chai = require("chai");

var _appAgent = require("../app/agent");

var _appAgent2 = _interopRequireDefault(_appAgent);

var _appDatabase = require("../app/database");

var _appDatabase2 = _interopRequireDefault(_appDatabase);

process.env.TESTING = true;

_q2["default"].longStackSupport = true;

before(function (done) {
  _appDatabase2["default"].then(function (module) {
    module.fixturesReset().then(function (data) {
      // Trigger other tests.
      // Note: we must load these after the fixtures finish, since even
      // _describing_ the require()d tests needs the fixtures: the App
      // requests come before describe the describe calls, and those
      // requests will fail if the fixtures aren't in place.
      require("./http-compliance");
      require("./content-negotiation");
      require("./fetch-collection");
      require("./create-resource");
      done();
    }).done();
  });
});