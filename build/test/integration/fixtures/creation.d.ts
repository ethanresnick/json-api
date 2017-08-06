export declare const VALID_PERSON_RESOURCE_NO_ID: {
    "type": string;
    "attributes": {
        "name": string;
        "email": string;
        "gender": string;
    };
};
export declare const VALID_ORG_RESOURCE_NO_ID: {
    "type": string;
    "attributes": {
        "name": string;
        "modified": string;
    };
    "relationships": {
        "liaisons": {
            "data": {
                "type": string;
                "id": string;
            }[];
        };
    };
};
export declare const VALID_ORG_RESOURCE_NO_ID_EXTRA_MEMBER: {
    "extraMember": boolean;
    "type": string;
    "attributes": {
        "name": string;
        "modified": string;
    };
    "relationships": {
        "liaisons": {
            "data": {
                "type": string;
                "id": string;
            }[];
        };
    };
};
export declare const ORG_RESOURCE_CLIENT_ID: {
    "id": string;
    "type": string;
    "attributes": {
        "name": string;
        "modified": string;
    };
    "relationships": {
        "liaisons": {
            "data": {
                "type": string;
                "id": string;
            }[];
        };
    };
};
export declare const VALID_SCHOOL_RESOURCE_NO_ID: {
    "type": string;
    "attributes": {
        "name": string;
    };
};
export declare const INVALID_ORG_RESOURCE_NO_DATA_IN_RELATIONSHIP: {
    "type": string;
    "relationships": {
        "liaisons": {
            "type": string;
            "id": string;
        };
    };
};
