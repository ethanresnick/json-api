import { Sort } from '../../types/index';
export declare type StringListParam = string[];
export declare type ScopedParam = {
    [scopeName: string]: any;
};
export declare type ScopedStringListParam = {
    [scopeName: string]: string[];
};
export declare type RawParams = {
    [paramName: string]: any;
};
export declare type ParsedQueryParams = {
    include?: StringListParam;
    sort?: Sort[];
    page?: ScopedParam;
    fields?: ScopedStringListParam;
    [paramName: string]: any;
};
export default function (params: RawParams): ParsedQueryParams;
