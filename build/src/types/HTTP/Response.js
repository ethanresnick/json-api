"use strict";

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utilTypeHandling = require("../../util/type-handling");

var propDesc = { writable: true, enumerable: true };

var Response = function Response() {
  _classCallCheck(this, Response);

  // The JSON-API extensions used to formulate the response,
  // which affects the final the Content-Type header and our
  // validation of the client's `Accept` header.
  this.ext = [];

  // The response's errors. If it has some,
  // we render them instead of a standard document.
  this.errors = [];

  // The response's content type.
  this.contentType = null;

  // Other headers in the response.
  this.headers = {
    location: null,
    vary: null
  };

  // The response's status.
  this.status = null;

  // The JSON for the response body, as a string.
  // Down the line, this might allow for a stream.
  this.body = null;

  // The response's primary data. Have to use
  // Object.defineProperty to default it to undefined
  // while allowing us to set it post seal().
  Object.defineProperty(this, "primary", propDesc);

  // The response's included resources.
  Object.defineProperty(this, "included", propDesc);

  // The response document's top-level links.
  Object.defineProperty(this, "links", propDesc);

  // The response document's top-level meta information.
  Object.defineProperty(this, "meta", propDesc);
};

exports["default"] = (0, _utilTypeHandling.ValueObject)(Response);
module.exports = exports["default"];