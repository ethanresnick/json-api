import ResourceTypeRegistry from '../ResourceTypeRegistry';
import { Response as SealedResponse } from "../types/HTTP/Response";
import Query from "../types/Query/Query";
import APIError from "../types/APIError";
export { SealedResponse };
declare class APIController {
    private registry;
    constructor(registry: ResourceTypeRegistry);
    handle(request: any, frameworkReq: any, frameworkRes: any, queryTransform?: (q: Query) => Query): Promise<SealedResponse>;
    static responseFromExternalError(errors: Error | APIError | Error[] | APIError[], requestAccepts: any): Promise<SealedResponse>;
    static supportedExt: ReadonlyArray<never>;
}
export default APIController;
