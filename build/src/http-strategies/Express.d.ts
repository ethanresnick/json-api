import Base, { HTTPStrategyOptions } from "./Base";
export default class ExpressStrategy extends Base {
    constructor(apiController: any, docsController: any, options?: HTTPStrategyOptions);
    apiRequest(req: any, res: any, next: any): void;
    docsRequest(req: any, res: any, next: any): void;
    sendResources(responseObject: any, res: any, next: any): any;
    sendError(errors: any, req: any, res: any): void;
}
