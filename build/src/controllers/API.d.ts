import ResourceTypeRegistry from '../ResourceTypeRegistry';
import { Response as SealedResponse } from "../types/HTTP/Response";
import APIError from "../types/APIError";
export { SealedResponse };
declare class APIController {
    private registry;
    constructor(registry: ResourceTypeRegistry);
    handle(request: any, frameworkReq: any, frameworkRes: any): Promise<SealedResponse>;
    static responseFromExternalError(errors: Error | APIError | Error[] | APIError[], requestAccepts: any): Promise<SealedResponse>;
    static supportedExt: ReadonlyArray<never>;
}
export default APIController;
