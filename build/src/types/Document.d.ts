import Resource, { ResourceJSON } from "./Resource";
import APIError, { APIErrorJSON } from './APIError';
import { PrimaryDataJSON, UrlTemplateFnsByType, Links } from './index';
import Relationship from './Relationship';
import ResourceSet from './ResourceSet';
import ResourceIdentifierSet from "../types/ResourceIdentifierSet";
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
    links?: Links;
};
export declare type DocumentData = {
    meta?: object;
    included?: Resource[];
    primary?: ResourceSet | Relationship | ResourceIdentifierSet;
    errors?: APIError[];
    urlTemplates?: UrlTemplateFnsByType;
};
export default class Document {
    meta: DocumentData['meta'];
    included: DocumentData['included'];
    primary: DocumentData['primary'];
    errors: DocumentData['errors'];
    urlTemplates: UrlTemplateFnsByType;
    constructor(data: DocumentData);
    toJSON(): DocumentJSON;
    toString(): string;
    clone(): Document;
}
