"use strict";
module.exports = {
  inherit: function (child, parent) {
    const __hasProp = {}.hasOwnProperty;
    for (let key in parent) {
      if (__hasProp.call(parent, key)) child[key] = parent[key];
    }
    function Ctor() { this.constructor = child; }
    Ctor.prototype = parent.prototype;
    child.prototype = new Ctor();
    return child;
  }
};
