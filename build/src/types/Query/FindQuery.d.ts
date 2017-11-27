import WithCriteriaQuery, { WithCriteriaQueryOptions } from "./WithCriteriaQuery";
import { Sort, AndPredicate } from '../index';
export declare type FindQueryOptions = WithCriteriaQueryOptions & {
    populates?: string[];
    select?: {
        [typeName: string]: string[];
    };
    sort?: Sort[];
};
export default class FindQuery extends WithCriteriaQuery {
    protected query: {
        type: FindQueryOptions['type'];
        returning: FindQueryOptions['returning'];
        catch: FindQueryOptions['catch'];
        select?: FindQueryOptions['select'];
        sort?: FindQueryOptions['sort'];
        populates: string[];
        criteria: {
            where: AndPredicate;
            singular: boolean;
            limit?: FindQueryOptions['limit'];
            offset?: FindQueryOptions['offset'];
        };
    };
    constructor({populates, select, sort, ...baseOpts}: FindQueryOptions);
    onlyPopulates(paths: string[]): this;
    withPopulates(paths: string[]): this;
    withoutPopulates(paths: string[]): this;
    readonly populates: string[];
    readonly select: {
        [typeName: string]: string[];
    } | undefined;
    readonly sort: Sort[] | undefined;
}
