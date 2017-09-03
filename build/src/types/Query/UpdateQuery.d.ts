import Query, { QueryOptions } from "./Query";
import Resource from '../Resource';
import Collection from '../Collection';
export declare type UpdateQueryOptions = QueryOptions & {
    patch: Resource | Collection;
};
export default class UpdateQuery extends Query {
    protected query: {
        readonly using: QueryOptions['using'];
        readonly patch: UpdateQueryOptions['patch'];
    };
    constructor(opts: UpdateQueryOptions);
    readonly patch: Resource | Collection;
}
