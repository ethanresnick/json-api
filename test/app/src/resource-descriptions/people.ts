module.exports = {
  urlTemplates: {
    "self": "http://127.0.0.1:3000/people/{id}",
    "relationship": "http://127.0.0.1:3000/people/{ownerId}/relationships/{path}"
  },

  beforeRender(it) {
    // Hide the invisible sorcerer resource, and remove pointers to it as well
    // This id check works whether `it` is a Resource or ResourceIdentifier
    if(it.id === "59af14d3bbd18cd55ea08ea2") {
      return undefined;
    }

    return it;
  },

  transformLinkage: true
};
