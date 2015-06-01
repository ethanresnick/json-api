"use strict";
module.exports = {
  inherit: function (child, parent) { 
    var __hasProp = {}.hasOwnProperty;
    for (var key in parent) { 
      if (__hasProp.call(parent, key)) child[key] = parent[key]; 
    } 
    function ctor() { this.constructor = child; } 
    ctor.prototype = parent.prototype; 
    child.prototype = new ctor();
    return child; 
  }
};