import Query, { QueryOptions } from "./Query";
import Resource from '../Resource';
import Data from '../Data';
export declare type UpdateQueryOptions = QueryOptions & {
    patch: Data<Resource>;
};
export default class UpdateQuery extends Query {
    protected query: {
        type: QueryOptions['type'];
        returning: QueryOptions['returning'];
        catch: QueryOptions['catch'];
        patch: UpdateQueryOptions['patch'];
    };
    constructor({patch, ...baseOpts}: UpdateQueryOptions);
    readonly patch: Data<Resource>;
}
