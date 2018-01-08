/// <reference types="express" />
import { RequestOpts } from "../controllers/API";
import Base, { HTTPStrategyOptions, Controller } from "./Base";
import Query from "../types/Query/Query";
import { HTTPResponse, Request as JSONAPIRequest, Result } from "../types";
import { Request, Response, NextFunction } from "express";
export declare type DeprecatedQueryTransformNoReq = {
    (first: Query): Query;
};
export declare type DeprecatedQueryTransformWithReq = {
    (first: Request, second: Query): Query;
};
export declare type DeprecatedQueryTransform = DeprecatedQueryTransformNoReq | DeprecatedQueryTransformWithReq;
export default class ExpressStrategy extends Base {
    constructor(apiController: any, docsController: any, options?: HTTPStrategyOptions);
    protected buildRequestObject(req: Request): Promise<JSONAPIRequest>;
    protected sendResponse(response: HTTPResponse, res: Response, next: NextFunction): void;
    protected doRequest: (controller: Controller, req: Request, res: Response, next: NextFunction) => Promise<void>;
    docsRequest: (x1: Request, x2: Response, x3: NextFunction) => Promise<void>;
    apiRequest: (x1: Request, x2: Response, x3: NextFunction) => Promise<void>;
    customAPIRequest: (opts: RequestOpts) => (x1: Request, x2: Response, x3: NextFunction) => Promise<void>;
    transformedAPIRequest: (queryTransform: DeprecatedQueryTransform) => (x1: Request, x2: Response, x3: NextFunction) => Promise<void>;
    sendError: (errors: any, req: any, res: any, next: any) => Promise<void>;
    sendResult: (result: Result, req: any, res: any, next: any) => Promise<void>;
}
