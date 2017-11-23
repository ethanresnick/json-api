import Base, { HTTPStrategyOptions } from "./Base";
export default class ExpressStrategy extends Base {
    constructor(apiController: any, docsController: any, options?: HTTPStrategyOptions);
    docsRequest(req: any, res: any, next: any): void;
    sendResources(responseObject: any, res: any, next: any): any;
    sendError(errors: any, req: any, res: any): void;
    apiRequest(req: any, res: any, next: any): void;
    transformedAPIRequest(queryTransform: any): any;
    private apiRequestWithTransform(queryTransform, req, res, next);
}
