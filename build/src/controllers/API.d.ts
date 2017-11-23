import ResourceTypeRegistry from '../ResourceTypeRegistry';
import { HTTPResponse } from "../types";
import Query from "../types/Query/Query";
import APIError from "../types/APIError";
export declare type ErrOrErrArr = Error | APIError | Error[] | APIError[];
declare class APIController {
    private registry;
    constructor(registry: ResourceTypeRegistry);
    handle(request: any, frameworkReq: any, frameworkRes: any, queryTransform?: (q: Query) => Query | Promise<Query>): Promise<HTTPResponse>;
    static responseFromExternalError(errors: ErrOrErrArr, requestAccepts: any): Promise<HTTPResponse>;
    static supportedExt: ReadonlyArray<never>;
}
export default APIController;
