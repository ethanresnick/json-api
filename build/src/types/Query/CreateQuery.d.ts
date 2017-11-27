import Query, { QueryOptions } from "./Query";
import Resource from '../Resource';
import Collection from '../Collection';
export declare type CreateQueryOptions = QueryOptions & {
    records: Resource | Collection;
};
export default class CreateQuery extends Query {
    protected query: {
        type: QueryOptions['type'];
        returning: QueryOptions['returning'];
        catch: QueryOptions['catch'];
        records: CreateQueryOptions['records'];
    };
    constructor({records, ...baseOpts}: CreateQueryOptions);
    readonly records: Resource | Collection;
}
