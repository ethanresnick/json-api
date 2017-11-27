/// <reference types="express" />
import Base, { HTTPStrategyOptions } from "./Base";
import Query from "../types/Query/Query";
import { Request } from "express";
export declare type QueryTransformCurried = {
    (first: Query): Query;
};
export declare type QueryTransformWithReq = {
    (first: Request, second: Query): Query;
};
export declare type QueryTransform = QueryTransformCurried | QueryTransformWithReq;
export default class ExpressStrategy extends Base {
    constructor(apiController: any, docsController: any, options?: HTTPStrategyOptions);
    docsRequest(req: any, res: any, next: any): void;
    sendResources(responseObject: any, res: any, next: any): any;
    sendError(errors: any, req: any, res: any): void;
    apiRequest(req: any, res: any, next: any): void;
    transformedAPIRequest(queryTransform: QueryTransform): any;
    private apiRequestWithTransform(queryTransform, req, res, next);
}
