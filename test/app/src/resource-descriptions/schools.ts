module.exports = {
  parentType: "organizations",
  urlTemplates: {
    "self": "http://127.0.0.1:3000/schools/{id}",
    "relationship": "http://127.0.0.1:3000/schools/{ownerId}/relationships/{path}",
    "related": "http://127.0.0.1:3000/schools/{ownerId}/{path}"
  },


  info: {
    "description": "A description of your School resource (optional).",
    "fields": {
      "isCollege": {
        "description": "Whether the school is a college, by the U.S. meaning."
      }
    }
  },

  beforeSave: function(resource, req, res, superFn) {
    return new Promise((resolve, reject) => {
      resource.attrs.modified = new Date("2015-10-27T05:16:57.257Z");
      resolve(resource);
    }).then((transformed) => superFn(transformed, req, res));
  }
};
