import { Request as UnsealedRequest } from "../types/HTTP/Request";
import APIController from "../controllers/API";
import DocsController from "../controllers/Documentation";
export { UnsealedRequest };
export default class BaseStrategy {
    protected api: APIController;
    protected docs: DocsController;
    protected config: {
        handleContentNegotiation: boolean;
        tunnel: boolean;
    };
    constructor(apiController: APIController, docsController: DocsController, options: object);
    buildRequestObject(req: any, protocol: any, host: any, params: any, query?: any): Promise<UnsealedRequest>;
}
