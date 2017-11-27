import Query, { QueryOptions } from "./Query";
import Resource from '../Resource';
import Collection from '../Collection';
export declare type UpdateQueryOptions = QueryOptions & {
    patch: Resource | Collection;
};
export default class UpdateQuery extends Query {
    protected query: {
        type: QueryOptions['type'];
        returning: QueryOptions['returning'];
        catch: QueryOptions['catch'];
        patch: UpdateQueryOptions['patch'];
    };
    constructor({patch, ...baseOpts}: UpdateQueryOptions);
    readonly patch: Resource | Collection;
}
