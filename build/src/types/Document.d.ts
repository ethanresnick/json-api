import Collection from "./Collection";
import APIError, { APIErrorJSON } from './APIError';
import { URLTemplates } from "../ResourceTypeRegistry";
import { PrimaryData, PrimaryDataJSON } from './index';
export declare type DocumentJSON = ({
    data: PrimaryDataJSON;
    errors: undefined;
    included?: Collection;
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
    included?: Collection;
    primary?: PrimaryData;
    errors?: APIError[];
    reqURI?: string;
    urlTemplates?: URLTemplates;
};
export default class Document {
    meta: DocumentData['meta'];
    included: DocumentData['included'];
    primary: DocumentData['primary'];
    errors: DocumentData['errors'];
    reqURI: DocumentData['reqURI'];
    urlTemplates: URLTemplates;
    constructor(data: DocumentData);
    toJSON(): DocumentJSON;
    toString(): string;
}
