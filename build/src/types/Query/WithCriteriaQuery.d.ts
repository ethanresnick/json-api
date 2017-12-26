import Query, { QueryOptions } from './Query';
import { FieldConstraint, Predicate, AndPredicate } from "../index";
export declare type WithCriteriaQueryOptions = QueryOptions & {
    limit?: number;
    offset?: number;
    singular?: boolean;
    filters?: (FieldConstraint | Predicate)[];
    ids?: string[];
    id?: string;
};
export default class WithCriteriaQuery extends Query {
    protected query: QueryOptions & {
        criteria: {
            where: AndPredicate;
            singular: boolean;
            offset?: number;
            limit?: number;
        };
    };
    constructor(opts: WithCriteriaQueryOptions);
    andWhere(constraint: FieldConstraint | Predicate): this;
    matchingIdOrIds(idOrIds?: string | string[] | undefined): any;
    getIdOrIds(): string | string[] | undefined;
    getFilters(excludeIdFilters?: boolean): AndPredicate;
    readonly offset: number | undefined;
    readonly limit: number | undefined;
}
