"use strict";

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

_Object$defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = function (Organization, OrganizationSchema) {
  //School extends Organization,
  //adding the following properties
  var schema = new OrganizationSchema({
    isCollege: Boolean
  });

  schema.statics.findCollegeIds = function () {
    return this.find({ isCollege: true }, "_id").lean().exec().then(function (members) {
      if (!members.length) {
        return undefined;
      } else {
        return members.reduce(function (prev, curr) {
          prev.push(curr._id.toString());
          return prev;
        }, []);
      }
    });
  };

  return Organization.discriminator("School", schema);
};

module.exports = exports["default"];