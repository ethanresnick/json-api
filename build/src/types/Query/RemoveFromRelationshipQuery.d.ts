import Query, { QueryOptions } from "./Query";
import Linkage from '../Linkage';
export declare type RemoveFromRelationshipQueryOptions = QueryOptions & {
    id: string | number;
    relationshipName: string;
    linkage: Linkage;
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
    readonly linkage: Linkage;
}
