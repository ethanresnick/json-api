import Linkage, { LinkageJSON } from './Linkage';
import Resource from './Resource';
import Collection from './Collection';
import Document from "./Document";
export declare type PrimaryData = Resource | Collection | null | Linkage;
export declare type PrimaryDataJSON = Resource | Collection | null | LinkageJSON;
export declare type Sort = {
    field: string;
    direction: 'ASC' | 'DESC';
};
export declare type Predicate = {
    operator: "and" | "or";
    value: (FieldConstraint | Predicate)[];
    field: undefined;
};
export declare type AndPredicate = Predicate & {
    operator: "and";
};
export declare type FieldConstraint = ({
    operator: "eq" | 'neq' | 'ne';
    value: number | string | boolean;
} | {
    operator: "in" | "nin";
    value: string[] | number[];
} | {
    operator: 'lt' | 'gt' | 'lte' | 'gte';
    value: string | number;
}) & {
    field: string;
};
export declare type Result = {
    headers?: {
        [headerName: string]: string;
    };
    ext?: string[];
    status?: number;
    document?: Document;
};
export declare type HTTPResponse = {
    headers: {
        [headerName: string]: string;
    };
    status: number;
    body?: string;
};
