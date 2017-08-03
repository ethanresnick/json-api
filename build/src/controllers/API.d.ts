/// <reference types="node" />
/// <reference types="q" />
import { IncomingMessage } from "http";
import ResourceTypeRegistry from '../ResourceTypeRegistry';
import { Request } from '../types/index';
import { Response as SealedResponse } from "../types/HTTP/Response";
import APIError from "../types/APIError";
export { SealedResponse };
declare class APIController {
    private registry;
    constructor(registry: ResourceTypeRegistry);
    handle(request: Request, frameworkReq: IncomingMessage, frameworkRes: any): any;
    static responseFromExternalError(errors: Error | APIError | Error[] | APIError[], requestAccepts: any): Q.Promise<SealedResponse>;
    static supportedExt: ReadonlyArray<never>;
}
export default APIController;
