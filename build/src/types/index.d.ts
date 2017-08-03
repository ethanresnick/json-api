import Linkage, { LinkageJSON } from './Linkage';
import Document from './Document';
import Resource from './Resource';
import Collection from './Collection';
import APIError from "./APIError";
export declare type PrimaryData = Resource | Collection | null | Linkage;
export declare type PrimaryDataJSON = Resource | Collection | null | LinkageJSON;
export declare type PrimaryDataOrErrors = PrimaryData | APIError[];
export declare const requestValidMethods: string[];
export declare type Request = {
    method: string;
    uri: {
        protocol: string;
        host: string;
        pathname: string;
        queryParams: object;
    };
    headers: {
        contentType?: {
            type: string;
            parameters?: object;
        };
        accepts?: string;
    };
    body?: any;
    frameworkParams: {
        type: string;
        relationship?: boolean;
        label?: string;
        id?: string;
        idOrLabel?: string;
    };
};
export declare type ValidatedRequest = Request & {
    method: "patch" | "post" | "delete" | "get";
    body?: {
        data: object;
    };
    headers: {
        contentType?: {
            type: "application/vnd.api+json";
        };
    };
};
export declare type QueryFindResult = {
    primary: Resource | Collection | null;
    included?: Collection;
};
export declare type Query = {
    method: "find";
    criteria: PaginationAndSortingCriteria & ProjectionCriteria & WhereCriteria & QueryCriteria;
    populates?: object;
    returning: (queryResult: QueryFindResult, acc: Partial<Document>) => Partial<Document>;
} | {
    method: "create";
    records: [object];
} | {
    method: "update";
    criteria: QueryCriteria;
} | {
    method: "destroy";
    criteria: QueryCriteria;
} | {
    method: "count";
    criteria: QueryCriteria;
} | {
    method: "avg";
    numericAttrName: string;
    criteria: QueryCriteria;
} | {
    method: "sum";
    numericAttrName: string;
    criteria: QueryCriteria;
} | {
    method: "findRelationship";
    resourceId: string;
    relationshipName: string;
} | {
    method: "addToRelationship";
    resourceId: string | number;
    relationshipName: string;
    linkage: Linkage;
} | {
    method: "removeFromRelationship";
    resourceId: string | number;
    relationshipName: string;
    linkage: Linkage;
} & {
    meta?: object;
    using: string;
    returning: (queryResult: any, acc: Partial<Document>) => Partial<Document>;
};
export declare type QueryCriteria = {
    sum: undefined;
    groupBy: undefined;
    average: undefined;
};
export declare type WhereCriteria = {
    where: AndPredicate | OrPredicate;
};
export declare type AndPredicate = {
    and: Constraint[];
    or: undefined;
};
export declare type OrPredicate = {
    or: Constraint[];
    and: undefined;
};
export declare type Constraint = AndPredicate | OrPredicate | {
    [fieldName: string]: number | string | boolean | {
        in: string[] | number[];
    } | {
        nin: string[] | number[];
    } | {
        '<': string | number;
    } | {
        '<=': string | number;
    } | {
        '>': string | number;
    } | {
        '>=': string | number;
    } | {
        '!=': string | number;
    } | {
        like: string | number;
    } | {
        contains: string | number;
    } | {
        startsWith: string | number;
    } | {
        endsWith: string | number;
    };
};
export declare type ProjectionCriteria = {
    select: string[];
    omit: string[];
};
export declare type PaginationAndSortingCriteria = {
    skip?: number;
    limit?: number | null;
    sort?: object;
};
