"use strict";

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _index = require("../../../../index");

var _index2 = _interopRequireDefault(_index);

var _databaseIndex = require("../database/index");

var _databaseIndex2 = _interopRequireDefault(_databaseIndex);

/**
 * Export a promise for the app.
 */
exports["default"] = _databaseIndex2["default"].then(function (dbModule) {
  var adapter = new _index2["default"].dbAdapters.Mongoose(dbModule.models()),
      registry = new _index2["default"].ResourceTypeRegistry(),
      Controller = new _index2["default"].controllers.API(registry);

  ["people", "organizations", "schools"].forEach(function (resourceType) {
    var description = require("./resource-descriptions/" + resourceType);
    description.dbAdapter = adapter;
    registry.type(resourceType, description);
  });

  // Initialize the automatic documentation.
  // Note: don't do this til after you've registered all your resources.)
  var Docs = new _index2["default"].controllers.Documentation(registry, { name: "Example API" });

  // Initialize the express app + front controller.
  var app = (0, _express2["default"])();

  var Front = new _index2["default"].httpStrategies.Express(Controller, Docs);
  var apiReqHandler = Front.apiRequest.bind(Front);

  // Now, add the routes.
  // To do this in a more scalable and configurable way, check out
  // http://github.com/ethanresnick/express-simple-router. To protect some
  // routes, check out http://github.com/ethanresnick/express-simple-firewall.
  app.get("/", Front.docsRequest.bind(Front));
  app.route("/:type(people|organizations|schools)").get(apiReqHandler).post(apiReqHandler).patch(apiReqHandler);
  app.route("/:type(people|organizations|schools)/:id").get(apiReqHandler).patch(apiReqHandler)["delete"](apiReqHandler);
  app.route("/:type(people|organizations|schools)/:id/:related").get(apiReqHandler);
  app.route("/:type(people|organizations|schools)/:id/relationships/:relationship").get(apiReqHandler).post(apiReqHandler).patch(apiReqHandler);

  app.use(function (req, res, next) {
    Front.sendError({ "message": "Not Found", "status": 404 }, req, res);
  });

  return app;
});
module.exports = exports["default"];