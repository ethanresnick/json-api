export const VALID_ORG_RESOURCE_NO_ID = {
  "type": "organizations",
  "attributes": {
    "name": "Test Organization",
    "modified": "2015-01-01T00:00:00.000Z"
  },
  "relationships": {
    "liaisons": {
      "data": [{"type": "people", "id": "53f54dd98d1e62ff12539db3"}]
    }
  }
};

export const VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER = Object.assign(
  {"extraMember": true}, VALID_ORG_RESOURCE_NO_ID
);

export const ORG_RESOURCE_CLIENT_ID = Object.assign(
  {"id": "53f54dd98d1e62ff12539db3"}, VALID_ORG_RESOURCE_NO_ID
);

export const VALID_SCHOOL_RESOURCE_NO_ID = {
  "type": "schools",
  "attributes": {
    "name": "Test School"
  }
};

export const INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP = {
  "type": "organizations",
  "relationships": {
    "liaisons": {
      "type": "people", "id": "53f54dd98d1e62ff12539db3"
    }
  }
};
