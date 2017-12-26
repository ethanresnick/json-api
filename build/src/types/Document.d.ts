import Resource, { ResourceJSON } from "./Resource";
import APIError, { APIErrorJSON } from './APIError';
import { PrimaryDataJSON, UrlTemplateFnsByType } from './index';
import ResourceSet from './ResourceSet';
import Relationship from './Relationship';
export declare type DocumentJSON = ({
    data: PrimaryDataJSON;
    errors: undefined;
    included?: ResourceJSON[];
} | {
    errors: APIErrorJSON[];
    data: undefined;
    included: undefined;
}) & {
    meta?: object;
    links?: object;
};
export declare type DocumentData = {
    meta?: object;
    included?: Resource[];
    primary?: ResourceSet | Relationship;
    errors?: APIError[];
    reqURI?: string;
    urlTemplates?: UrlTemplateFnsByType;
};
export default class Document {
    meta: DocumentData['meta'];
    included: DocumentData['included'];
    primary: DocumentData['primary'];
    errors: DocumentData['errors'];
    reqURI: DocumentData['reqURI'];
    urlTemplates: UrlTemplateFnsByType;
    constructor(data: DocumentData);
    toJSON(): DocumentJSON;
    toString(): string;
}
