export const VALID_ORG_STATE_GOVT_PATCH = {
  "type": "organizations",
  "id": "54419d550a5069a2129ef254",
  "attributes": {
    "name": "State Government Renamed"
  }
};

export const VALID_ORG_VIRTUAL_PATCH = {
  "type": "organizations",
  "id": "59ac9c0ecc4c356fcda65202",
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
