import { PrimaryData } from "../../types/index";
import Collection from "../../types/Collection";
import APIError from "../../types/APIError";
export declare class Response {
    ext: string[];
    errors: APIError[];
    contentType: string | null;
    headers: {
        [headerName: string]: string;
    };
    status: number | null;
    body: string | null;
    primary: undefined | PrimaryData;
    included: undefined | Collection;
    meta: object | undefined;
    constructor();
}
declare const _default: {
    (initial?: Partial<Response> | undefined): Response;
    new (initial?: Partial<Response> | undefined): Response;
};
export default _default;
