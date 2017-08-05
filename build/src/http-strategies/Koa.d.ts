import Base from "./Base";
export default class KoaStrategy extends Base {
    constructor(apiController: any, docsController: any, options: any);
    apiRequest(): (next: any) => IterableIterator<any>;
    docsRequest(): (next: any) => IterableIterator<any>;
    sendResources(responseObject: any, ctx: any): void | true;
    sendError(errors: any, ctx: any): void;
}
