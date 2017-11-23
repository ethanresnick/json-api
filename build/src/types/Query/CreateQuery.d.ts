import Query, { QueryOptions } from "./Query";
import Resource from '../Resource';
import Collection from '../Collection';
export declare type CreateQueryOptions = QueryOptions & {
    records: Resource | Collection;
};
export default class CreateQuery extends Query {
    protected query: {
        readonly type: QueryOptions['type'];
        readonly returning: QueryOptions['returning'];
        readonly catch: QueryOptions['catch'];
        readonly records: CreateQueryOptions['records'];
    };
    constructor({records, ...baseOpts}: CreateQueryOptions);
    readonly records: Resource | Collection;
}
