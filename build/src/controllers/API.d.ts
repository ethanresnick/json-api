import ResourceTypeRegistry from '../ResourceTypeRegistry';
import { HTTPResponse, Predicate, FieldConstraint } from "../types";
import Query from "../types/Query/Query";
import APIError from "../types/APIError";
export declare type ErrOrErrArr = Error | APIError | Error[] | APIError[];
export declare type APIControllerOpts = {
    filterParser?: filterParamParser;
};
export declare type filterParamParser = (legalUnaryOpts: string[], legalBinaryOpts: string[], rawQuery: string | undefined, parsedParams: object) => (Predicate | FieldConstraint)[] | undefined;
declare class APIController {
    private registry;
    private filterParamParser;
    constructor(registry: ResourceTypeRegistry, opts?: APIControllerOpts);
    handle(request: any, frameworkReq: any, frameworkRes: any, queryTransform?: (q: Query) => Query | Promise<Query>): Promise<HTTPResponse>;
    static responseFromExternalError(errors: ErrOrErrArr, requestAccepts: any): Promise<HTTPResponse>;
    static supportedExt: ReadonlyArray<never>;
    static defaultFilterParamParser(legalUnary: any, legalBinary: any, rawQuery: any, params: any): (({
        operator: "eq" | "neq" | "ne";
        value: string | number | boolean;
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
export default APIController;
