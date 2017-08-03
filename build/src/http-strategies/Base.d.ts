/// <reference types="node" />
import { IncomingMessage } from "http";
import { Request } from "../types/index";
import APIController from "../controllers/API";
import DocsController from "../controllers/Documentation";
export default class BaseStrategy {
    protected api: APIController;
    protected docs: DocsController;
    protected config: {
        handleContentNegotiation: boolean;
        tunnel: boolean;
    };
    constructor(apiController: APIController, docsController: DocsController, options: object);
    buildRequestObject(req: IncomingMessage, protocol: string, host: string, params: Request['frameworkParams'], query?: any): Promise<Request>;
}
