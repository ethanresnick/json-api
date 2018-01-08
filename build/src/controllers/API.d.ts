/// <reference types="node" />
/// <reference types="ramda" />
import R = require("ramda");
import { Request, FinalizedRequest, Result, HTTPResponse, ServerReq, ServerRes, Predicate, FieldConstraint, makeDocument } from "../types";
import Query from "../types/Query/Query";
import ResourceTypeRegistry from '../ResourceTypeRegistry';
import Document, { DocumentData } from "../types/Document";
import APIError from "../types/APIError";
import { TransformMode } from "../steps/apply-transform";
import { IncomingMessage, ServerResponse } from "http";
import CreateQuery from "../types/Query/CreateQuery";
import FindQuery from "../types/Query/FindQuery";
import UpdateQuery from "../types/Query/UpdateQuery";
import DeleteQuery from "../types/Query/DeleteQuery";
import AddToRelationshipQuery from "../types/Query/AddToRelationshipQuery";
import RemoveFromRelationshipQuery from "../types/Query/RemoveFromRelationshipQuery";
export { CreateQuery, FindQuery, UpdateQuery, DeleteQuery, AddToRelationshipQuery, RemoveFromRelationshipQuery, IncomingMessage, ServerResponse };
export declare type ErrOrErrArr = Error | APIError | Error[] | APIError[];
export declare type APIControllerOpts = {
    filterParser?: filterParamParser;
};
export declare type QueryFactory = (opts: QueryBuildingContext) => Query | Promise<Query>;
export declare type QueryBuildingContext = {
    request: FinalizedRequest;
    serverReq: ServerReq;
    serverRes: ServerRes;
    transformDocument: (doc: Document, mode: TransformMode) => Promise<Document>;
    registry: ResourceTypeRegistry;
    makeDocument: makeDocument;
    makeQuery: QueryFactory;
};
export declare type RequestOpts = {
    queryFactory?: QueryFactory;
};
export declare type filterParamParser = (legalUnaryOpts: string[], legalBinaryOpts: string[], rawQuery: string | undefined, parsedParams: object) => (Predicate | FieldConstraint)[] | undefined;
export default class APIController {
    private registry;
    private filterParamParser;
    private urlTemplateFns;
    constructor(registry: ResourceTypeRegistry, opts?: APIControllerOpts);
    protected makeDoc: (data: DocumentData) => Document;
    protected finalizeRequest(request: Request): Promise<FinalizedRequest>;
    makeQuery(opts: QueryBuildingContext): Promise<CreateQuery | FindQuery | DeleteQuery | UpdateQuery | AddToRelationshipQuery | RemoveFromRelationshipQuery>;
    handle: (request: Request, serverReq: IncomingMessage, serverRes: ServerResponse, opts?: RequestOpts) => Promise<HTTPResponse>;
    static responseFromError(errors: ErrOrErrArr, requestAccepts: any): Promise<HTTPResponse>;
    static responseFromResult(result: Result, reqAccepts?: string, allow406?: boolean): Promise<HTTPResponse>;
    static supportedExt: ReadonlyArray<never>;
    static defaultFilterParamParser(legalUnary: any, legalBinary: any, rawQuery: any, params: any): (({
        operator: "eq" | "neq" | "ne";
        value: R.Ord;
    } & {
        field: string;
    }) | ({
        operator: "in" | "nin";
        value: string[] | number[];
    } & {
        field: string;
    }) | ({
        operator: "lt" | "gt" | "lte" | "gte";
        value: string | number;
    } & {
        field: string;
    }) | Predicate)[] | undefined;
}
