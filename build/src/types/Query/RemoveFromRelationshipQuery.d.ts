import Query, { QueryOptions } from "./Query";
import Data from '../Data';
import ResourceIdentifier from '../ResourceIdentifier';
export declare type RemoveFromRelationshipQueryOptions = QueryOptions & {
    id: string | number;
    relationshipName: string;
    linkage: Data<ResourceIdentifier>;
};
export default class RemoveFromRelationshipQuery extends Query {
    protected query: {
        type: QueryOptions['type'];
        returning: QueryOptions['returning'];
        catch: QueryOptions['catch'];
        id: RemoveFromRelationshipQueryOptions['id'];
        relationshipName: RemoveFromRelationshipQueryOptions['relationshipName'];
        linkage: RemoveFromRelationshipQueryOptions['linkage'];
    };
    constructor(opts: RemoveFromRelationshipQueryOptions);
    readonly id: string | number;
    readonly relationshipName: string;
    readonly linkage: Data<ResourceIdentifier>;
}
