export const VALID_ORG_STATE_GOVT_PATCH = {
  "type": "organizations",
  "id": "54419d550a5069a2129ef254",
  "attributes": {
    "name": "State Government Renamed"
  }
};

// These patches may be submitted, but should never be accepted by the API,
// because we'll always modify them in various ways on use to make them invalid.
export const NEVER_APPLIED_STATE_GOVT_PATCH = {
  "type": "organizations",
  "id": "54419d550a5069a2129ef254",
  "attributes": {
    "name": "astienaseti"
  }
};

export const NEVER_APPLIED_SCHOOL_PATCH = {
  "type": "organizations",
  "id": "59af14d3bbd18cd55ea08ea3",
  "attributes": {
    "name": "astienaseti"
  }
}

export const VALID_ORG_VIRTUAL_PATCH = {
  "type": "organizations",
  "id": "59ac9c0ecc4c356fcda65202",
  "attributes": {
    "name": "changed name",
    "echo": "Hello!"
  }
};

export const INVALID_ORG_PATCH_NO_ID = {
  "type": "organizations",
  "attributes": {
    "name": "changed name",
    "echo": "Hello!"
  }
};

export const VALID_ORG_RELATIONSHIP_PATCH = {
  "data": [{
    "type": "people", "id": "53f54dd98d1e62ff12539db3"
  }]
};

export const VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH = {
  "data": []
};

export const VALID_TO_ONE_RELATIONSHIP_EMPTY_PATCH = {
  "data": null
};

export const VALID_SCHOOL_PRINCIPAL_PATCH = {
  data: {
    "type": "people", "id": "53f54dd98d1e62ff12539db3"
  }
};
