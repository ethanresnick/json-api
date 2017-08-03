export default class Request {
    hasBody: boolean | null;
    needsBody: boolean | null;
    body: string | undefined;
    method: string;
    uri: string;
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
