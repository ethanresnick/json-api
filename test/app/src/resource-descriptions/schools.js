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
  }
};
