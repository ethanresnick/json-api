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
        readonly type: FindQueryOptions['type'];
        readonly select?: FindQueryOptions['select'];
        readonly sort?: FindQueryOptions['sort'];
        readonly populates: FindQueryOptions['populates'];
        readonly criteria: {
            readonly where: AndPredicate;
            readonly singular: boolean;
            readonly limit?: FindQueryOptions['limit'];
            readonly offset?: FindQueryOptions['offset'];
        };
    };
    constructor(opts: FindQueryOptions);
    populate(paths: any): any;
    depopulate(paths: any): any;
    readonly populates: string[] | undefined;
    readonly select: {
        [typeName: string]: string[];
    } | undefined;
    readonly sort: Sort[] | undefined;
}
