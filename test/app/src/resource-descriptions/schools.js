import { Promise } from "q";
import API from "../../../../../index";
let APIError = API.types.Error;

module.exports = {
  parentType: "organizations",
  urlTemplates: {
    "self": "http://127.0.0.1:3000/schools/{id}",
    "relationship": "http://127.0.0.1:3000/schools/{ownerId}/links/{path}",
    "related": "http://127.0.0.1:3000/schools/{ownerId}/{path}"
  },

  labelMappers: {
    "colleges": function(model, req) {
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

  beforeSave(resource) {
    return new Promise((resolve, reject) => {
      resource.attrs.description = "Modified in a Promise";
      resolve(resource);
    });
  },

  beforeDelete(resource) {
    throw new APIError(403, undefined, "You are not allowed to delete schools.");
  }
};
