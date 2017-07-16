import Collection from "./Collection";
import { APIErrorJSON } from './APIError';
import { URLTemplates } from "../ResourceTypeRegistry";
import { PrimaryDataOrErrors, PrimaryDataJSON } from './index';
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
export default class Document {
    meta: object | undefined;
    reqURI: string | undefined;
    included: undefined | Collection;
    primaryOrErrors: PrimaryDataOrErrors;
    protected urlTemplates: URLTemplates;
    constructor(primaryOrErrors: PrimaryDataOrErrors, included?: undefined | Collection, meta?: object | undefined, urlTemplates?: URLTemplates, reqURI?: string | undefined);
    get(): DocumentJSON;
    get(stringify: true): string;
    get(stringify: false): DocumentJSON;
}
