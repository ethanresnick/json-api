"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Context = function Context() {
  _classCallCheck(this, Context);

  // Whether the request or response has a body.
  // On requests, this is useful for knowing whether we need
  // to check the Content-Type. On responses, it's useful for
  // knowing whether we need to render a document or do 204.
  this.hasBody;

  //
  this.needsBody;
};