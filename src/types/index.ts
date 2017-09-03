import Linkage, { LinkageJSON } from './Linkage';
import Resource from './Resource';
import Collection from './Collection';
import APIError from "./APIError";

export type PrimaryData = Resource | Collection | null | Linkage;
export type PrimaryDataJSON = Resource | Collection | null | LinkageJSON;

export type PrimaryDataOrErrors = PrimaryData | APIError[];

export type Sort = { field: string; direction: 'ASC' | 'DESC' };

export type Predicate = {
  operator: "and" | "or";
  value: (FieldConstraint | Predicate)[];
  field: undefined;
};

export type AndPredicate = Predicate & { operator: "and" };

export type FieldConstraint = ({
  operator: "eq" | 'neq' | 'ne'; // ne and neq are synonyms
  value: number | string | boolean
} | {
  operator: "in" | "nin";
  value: string[] | number[]
} | {
  operator: 'lt' | 'gt' | 'lte' | 'gte';
  value: string | number;
}/* | {
  operator: '$like'; // not supported in our mongo transform yet
  value: string;
}*/) & {
  field: string;
};

export const BinaryOpts = ['eq', 'neq', 'ne', 'in', 'nin', 'lt', 'gt', 'lte', 'gte'];
export const UnaryOpts = ['and', 'or'];
