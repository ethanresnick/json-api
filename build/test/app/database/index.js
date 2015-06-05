"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

_Object$defineProperty(exports, "__esModule", {
  value: true
});

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _mongoose = require("mongoose");

var _mongoose2 = _interopRequireDefault(_mongoose);

var _nodeMongooseFixtures = require("node-mongoose-fixtures");

var _nodeMongooseFixtures2 = _interopRequireDefault(_nodeMongooseFixtures);

var _modelsPerson = require("./models/person");

var _modelsPerson2 = _interopRequireDefault(_modelsPerson);

var _modelsSchool = require("./models/school");

var _modelsSchool2 = _interopRequireDefault(_modelsSchool);

var _modelsOrganization = require("./models/organization");

var _modelsOrganization2 = _interopRequireDefault(_modelsOrganization);

var ObjectId = _mongoose2["default"].Types.ObjectId;
var govtId = ObjectId("54419d550a5069a2129ef254");
var smithId = ObjectId("53f54dd98d1e62ff12539db2");
var doeId = ObjectId("53f54dd98d1e62ff12539db3");

var OrganizationModel = _modelsOrganization2["default"].model;
var OrganizationSchema = _modelsOrganization2["default"].schema;

var _models = {
  Person: _modelsPerson2["default"],
  Organization: OrganizationModel,
  School: (0, _modelsSchool2["default"])(OrganizationModel, OrganizationSchema)
};

_nodeMongooseFixtures2["default"].save("all", {
  Person: [{ name: "John Smith", email: "jsmith@gmail.com", gender: "male", _id: smithId }, { name: "Jane Doe", gender: "female", _id: doeId }],
  Organization: [{ name: "State Government", description: "Representing the good people.", liaisons: [doeId, smithId], _id: govtId }],
  School: [{ name: "City College", description: "Just your average local college.", liaisons: [smithId] }, { name: "State College", description: "Just your average state college." }]
});

/**
 * Export a promise for an object that can get the models and load
 * and reset the fixtures.
 */
exports["default"] = _q2["default"].ninvoke(_mongoose2["default"], "connect", "mongodb://localhost/integration-test").then(function () {
  return {
    models: function models() {
      return _models;
    },
    instance: function instance() {
      return _mongoose2["default"];
    },
    fixturesRemoveAll: function fixturesRemoveAll() {
      return _q2["default"].npost(_nodeMongooseFixtures2["default"], "reset", []);
    },
    fixturesReset: function fixturesReset() {
      return this.fixturesRemoveAll().then(function () {
        return _q2["default"].nfcall(_nodeMongooseFixtures2["default"], "all");
      });
    }
  };
});
module.exports = exports["default"];