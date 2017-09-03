import Query, { QueryOptions } from "./Query";
import Resource from '../Resource';
import Collection from '../Collection';
export declare type CreateQueryOptions = QueryOptions & {
    records: Resource | Collection;
};
export default class CreateQuery extends Query {
    protected query: {
        readonly using: QueryOptions['using'];
        readonly records: CreateQueryOptions['records'];
    };
    constructor(opts: CreateQueryOptions);
    readonly records: Resource | Collection;
}
