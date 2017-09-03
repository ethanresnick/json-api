import Query, { QueryOptions } from './Query';
import { FieldConstraint, Predicate, AndPredicate } from "../index";
export declare type WithCriteriaQueryOptions = QueryOptions & {
    limit?: number;
    offset?: number;
    singular?: boolean;
    filters?: (FieldConstraint | Predicate)[];
    idOrIds?: string | string[] | undefined;
};
export default class WithCriteriaQuery extends Query {
    protected query: Readonly<QueryOptions & {
        criteria: Readonly<{
            where: AndPredicate;
            singular: boolean;
            offset?: number;
            limit?: number;
        }>;
    }>;
    constructor(opts: WithCriteriaQueryOptions);
    andWhere(constraint: FieldConstraint | Predicate): any;
    matchingIdOrIds(idOrIds?: WithCriteriaQueryOptions['idOrIds']): any;
    getIdOrIds(): string | string[] | undefined;
    getFilters(excludeIdFilters?: boolean): AndPredicate;
    readonly offset: number | undefined;
    readonly limit: number | undefined;
}
