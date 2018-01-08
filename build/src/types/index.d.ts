/// <reference types="node" />
import Resource, { ResourceJSON } from './Resource';
import ResourceIdentifier, { ResourceIdentifierJSON } from "./ResourceIdentifier";
import Document, { DocumentData } from "./Document";
import Data from "./Generic/Data";
import { ParsedQueryParams } from '../steps/pre-query/parse-query-params';
import { IncomingMessage, ServerResponse } from "http";
export declare type DataOf<T> = null | T | T[];
export declare type PrimaryData = DataOf<Resource> | DataOf<ResourceIdentifier>;
export declare type DataWithLinksArgs<T> = {
    data: T | T[] | null | Data<T>;
    links?: UrlTemplateFns;
};
export declare type LinkageJSON = DataOf<ResourceIdentifierJSON>;
export declare type PrimaryDataJSON = DataOf<ResourceJSON> | LinkageJSON;
export declare type Links = {
    [linkName: string]: any;
};
export declare type Reducer<T, U = any> = (acc: U, it: T, i: number, arr: T[]) => U;
export declare type PredicateFn<T> = (it: T, i: number, arr: T[]) => boolean;
export declare type Mapper<T, U> = (it: T, i: number, arr: T[]) => U;
export declare type AsyncMapper<T, U> = (it: T, i: number, arr: T[]) => U | Promise<U>;
export declare type ServerReq = IncomingMessage;
export declare type ServerRes = ServerResponse;
export declare type Sort = {
    field: string;
    direction: 'ASC' | 'DESC';
};
export declare type Predicate = {
    operator: "and" | "or";
    value: (FieldConstraint | Predicate)[];
    field: undefined;
};
export declare type AndPredicate = Predicate & {
    operator: "and";
};
export declare type FieldConstraint = ({
    operator: "eq" | 'neq' | 'ne';
    value: number | string | boolean;
} | {
    operator: "in" | "nin";
    value: string[] | number[];
} | {
    operator: 'lt' | 'gt' | 'lte' | 'gte';
    value: string | number;
}) & {
    field: string;
};
export declare type UrlTemplateFnsByType = {
    [typeName: string]: UrlTemplateFns;
};
export declare type UrlTemplateFns = {
    [linkName: string]: ((data: any) => string) | undefined;
};
export declare type Request = {
    body: any | undefined;
    method: string;
    uri: string;
    contentType: string | undefined;
    accepts: string | undefined;
    rawQueryString: string | undefined;
    queryParams: {
        [paramName: string]: any;
    };
    type: string;
    id: string | undefined;
    relationship: string | undefined;
    aboutRelationship: boolean;
};
export declare type FinalizedRequest = Request & {
    queryParams: ParsedQueryParams;
    document: Document | undefined;
};
export declare type Result = {
    headers?: {
        [headerName: string]: string;
    };
    ext?: string[];
    status?: number;
    document?: Document;
};
export interface HTTPResponse {
    headers: {
        "content-type"?: string;
        vary?: string;
    };
    status: number;
    body?: string;
}
export declare type makeDocument = (data: DocumentData) => Document;
