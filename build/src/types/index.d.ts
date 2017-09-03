import Linkage, { LinkageJSON } from './Linkage';
import Resource from './Resource';
import Collection from './Collection';
import APIError from "./APIError";
export declare type PrimaryData = Resource | Collection | null | Linkage;
export declare type PrimaryDataJSON = Resource | Collection | null | LinkageJSON;
export declare type PrimaryDataOrErrors = PrimaryData | APIError[];
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
export declare const BinaryOpts: string[];
export declare const UnaryOpts: string[];
