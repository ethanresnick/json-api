"use strict";
module.exports = {
  inherit: function inherit(child, parent) {
    var __hasProp = ({}).hasOwnProperty;
    for (var key in parent) {
      if (__hasProp.call(parent, key)) child[key] = parent[key];
    }
    function Ctor() {
      this.constructor = child;
    }
    Ctor.prototype = parent.prototype;
    child.prototype = new Ctor();
    return child;
  }
};