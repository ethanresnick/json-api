import Query, { QueryOptions } from "./Query";
import Resource from '../Resource';
import Collection from '../Collection';
export declare type UpdateQueryOptions = QueryOptions & {
    patch: Resource | Collection;
};
export default class UpdateQuery extends Query {
    protected query: {
        readonly type: QueryOptions['type'];
        readonly returning: QueryOptions['returning'];
        readonly catch: QueryOptions['catch'];
        readonly patch: UpdateQueryOptions['patch'];
    };
    constructor({patch, ...baseOpts}: UpdateQueryOptions);
    readonly patch: Resource | Collection;
}
