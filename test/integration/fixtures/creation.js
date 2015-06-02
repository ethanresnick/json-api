export var VALID_ORG_RESOURCE_NO_ID = {
  "type": "organizations",
  "attributes": {
    "name": "Test Organization",
  },
  "relationships": {
    "liaisons": {
      "data": [{"type": "people", "id": "53f54dd98d1e62ff12539db3"}]
    }
  }
};

export var VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER = Object.assign(
  {"extraMember": true}, VALID_ORG_RESOURCE_NO_ID
);

export var ORG_RESOURCE_CLIENT_ID = Object.assign(
  {"id": "53f54dd98d1e62ff12539db3"}, VALID_ORG_RESOURCE_NO_ID
);
