export declare type APIErrorJSON = {
    status?: string;
    code?: string;
    title?: string;
    detail?: string;
    links?: any;
    paths?: any;
};
export declare type Opts = {
    status?: string | number;
    code?: string | number;
    title?: string;
    detail?: string;
    links?: object;
    paths?: string[];
};
export declare const displaySafe: symbol;
export default class APIError extends Error {
    status?: string;
    code?: string;
    title?: string;
    detail?: string;
    links?: any;
    paths?: any;
    constructor(opts: Opts);
    constructor(status?: Opts['status'], code?: Opts['code'], title?: Opts['title'], detail?: Opts['detail'], links?: Opts['links'], paths?: Opts['paths']);
    toJSON(): APIErrorJSON;
    static fromError(err: any): APIError;
}
