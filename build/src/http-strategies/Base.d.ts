import { Request as UnsealedRequest } from "../types/HTTP/Request";
import APIController from "../controllers/API";
import DocsController from "../controllers/Documentation";
export { UnsealedRequest };
export declare type HTTPStrategyOptions = {
    handleContentNegotiation?: boolean;
    tunnel?: boolean;
};
export default class BaseStrategy {
    protected api: APIController;
    protected docs: DocsController;
    protected config: HTTPStrategyOptions;
    constructor(apiController: APIController, docsController: DocsController, options?: HTTPStrategyOptions);
    protected buildRequestObject(req: any, protocol: any, host: any, params: any, query?: any): Promise<UnsealedRequest>;
}
