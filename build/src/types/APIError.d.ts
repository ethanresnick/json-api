export declare type APIErrorJSON = {
    status?: string;
    code?: string;
    title?: string;
    detail?: string;
    links?: any;
    paths?: any;
};
export default class APIError extends Error {
    status?: string;
    code?: string;
    title?: string;
    detail?: string;
    links?: any;
    paths?: any;
    private _status?;
    private _code?;
    constructor(...args: any[]);
    toJSON(): APIErrorJSON;
    static fromError(err: any): APIError;
}
