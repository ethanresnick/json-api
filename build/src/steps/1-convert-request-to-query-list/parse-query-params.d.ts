import { Request } from '../../types/index';
export declare type stringListParam = string[];
export declare type scopedParam = {
    [scopeName: string]: any;
};
export declare type scopedStringListParam = {
    [scopeName: string]: string[];
};
export declare type ParsedQueryParams = {
    include?: stringListParam;
    sort?: stringListParam;
    page?: scopedParam;
    filter?: scopedParam;
    fields?: scopedStringListParam;
};
export default function (request: Request): Promise<ParsedQueryParams>;
