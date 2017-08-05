export declare class Request {
    hasBody: boolean | null;
    needsBody: boolean | null;
    body: string | undefined;
    method: string | null;
    uri: string | null;
    contentType: string | null;
    accepts: string | null;
    ext: string[];
    allowLabel: boolean;
    idOrIds: string | string[] | null;
    type: string | null;
    relationship: string | null;
    aboutRelationship: boolean;
    primary: any;
    queryParams: object;
    constructor();
}
declare const _default: {
    (initial?: Partial<Request> | undefined): Request;
    new (initial?: Partial<Request> | undefined): Request;
};
export default _default;
