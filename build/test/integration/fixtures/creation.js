"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_PERSON_RESOURCE_NO_ID = {
    "type": "people",
    "attributes": {
        "name": "Ethan Resnick",
        "email": "ethan.resnick@gmail.com",
        "gender": "male"
    }
};
exports.VALID_ORG_RESOURCE_NO_ID = {
    "type": "organizations",
    "attributes": {
        "name": "Test Organization",
        "modified": "2015-01-01T00:00:00.000Z"
    },
    "relationships": {
        "liaisons": {
            "data": [{ "type": "people", "id": "53f54dd98d1e62ff12539db3" }]
        }
    }
};
exports.VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER = Object.assign({}, exports.VALID_ORG_RESOURCE_NO_ID, { "extraMember": true });
exports.ORG_RESOURCE_CLIENT_ID = Object.assign({}, exports.VALID_ORG_RESOURCE_NO_ID, { "id": "53f54dd98d1e62ff12539db3" });
exports.VALID_SCHOOL_RESOURCE_NO_ID = {
    "type": "schools",
    "attributes": {
        "name": "Test School"
    }
};
exports.INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP = {
    "type": "organizations",
    "relationships": {
        "liaisons": {
            "type": "people", "id": "53f54dd98d1e62ff12539db3"
        }
    }
};
