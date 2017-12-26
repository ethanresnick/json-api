export declare const VALID_ORG_STATE_GOVT_PATCH: {
    "type": string;
    "id": string;
    "attributes": {
        "name": string;
    };
};
export declare const VALID_ORG_VIRTUAL_PATCH: {
    "type": string;
    "id": string;
    "attributes": {
        "name": string;
        "echo": string;
    };
};
export declare const VALID_ORG_RELATIONSHIP_PATCH: {
    "data": {
        "type": string;
        "id": string;
    }[];
};
export declare const VALID_TO_MANY_RELATIONSHIP_EMPTY_PATCH: {
    "data": never[];
};
export declare const VALID_TO_ONE_RELATIONSHIP_EMPTY_PATCH: {
    "data": null;
};
export declare const VALID_SCHOOL_PRINCIPAL_PATCH: {
    data: {
        "type": string;
        "id": string;
    };
};
