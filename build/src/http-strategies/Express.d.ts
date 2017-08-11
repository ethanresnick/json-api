import Base from "./Base";
export default class ExpressStrategy extends Base {
    constructor(apiController: any, docsController: any, options?: any);
    apiRequest(req: any, res: any, next: any): void;
    docsRequest(req: any, res: any, next: any): void;
    sendResources(responseObject: any, res: any, next: any): void;
    sendError(errors: any, req: any, res: any): void;
}
