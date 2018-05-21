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

  // Async just to test promises are allowed.
  async beforeSave(resource, meta, extras, superFn) {
    const transformed = await superFn(resource);
    transformed.attrs.modified = new Date("2015-10-27T05:16:57.257Z");

    // A special test for whether this beforeSave runs when patching
    // (organizations, 5a5934cfc810949cebeecc33), which happens to be a school.
    if(resource.id === '5a5934cfc810949cebeecc33') {
      transformed.attrs.description = "Special, beforeSave description.";
    }

    return transformed;
  },

  beforeRender(resource, meta, extras, superFn) {
    resource.attrs.schoolBeforeRender = true;
    return superFn(resource);
  },

  pagination: { defaultPageSize: 2 }
};
