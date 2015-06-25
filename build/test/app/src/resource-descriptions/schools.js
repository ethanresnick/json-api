"use strict";

var _q = require("q");

module.exports = {
  parentType: "organizations",
  urlTemplates: {
    "self": "http://127.0.0.1:3000/schools/{id}",
    "relationship": "http://127.0.0.1:3000/schools/{ownerId}/links/{path}",
    "related": "http://127.0.0.1:3000/schools/{ownerId}/{path}"
  },

  labelMappers: {
    "colleges": function colleges(model, req) {
      return model.findCollegeIds();
    }
  },

  info: {
    "description": "A description of your School resource (optional).",
    "fields": {
      "isCollege": {
        "description": "Whether the school is a college, by the U.S. meaning."
      }
    }
  },

  beforeSave: function beforeSave(resource) {
    return new _q.Promise(function (resolve, reject) {
      resource.attrs.description = "Modified in a Promise";
      resolve(resource);
    });
  }
};