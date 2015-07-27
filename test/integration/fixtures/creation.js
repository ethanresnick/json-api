export const VALID_ORG_RESOURCE_NO_ID = {
  "type": "organizations",
  "attributes": {
    "name": "Test Organization",
    "date-established": "2015-06-22T10:52:53-07:00",
    "date-of-hippo": "2015-09-22T00:00:00-07:00"
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
