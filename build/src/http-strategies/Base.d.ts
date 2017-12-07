import { Request } from "../types/";
import APIController from "../controllers/API";
import DocsController from "../controllers/Documentation";
export declare type HTTPStrategyOptions = {
    handleContentNegotiation?: boolean;
    tunnel?: boolean;
    host?: string;
};
export default class BaseStrategy {
    protected api: APIController;
    protected docs: DocsController;
    protected config: HTTPStrategyOptions;
    constructor(apiController: APIController, docsController: DocsController, options?: HTTPStrategyOptions);
    protected buildRequestObject(req: any, protocol: any, fallbackHost: any, params: any, parsedQuery?: any): Promise<Request>;
    protected getParsedBodyJSON(req: any): Promise<string | undefined>;
}
