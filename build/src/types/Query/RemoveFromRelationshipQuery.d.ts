import Query, { QueryOptions } from "./Query";
import Linkage from '../Linkage';
export declare type RemoveFromRelationshipQueryOptions = QueryOptions & {
    resourceId: string | number;
    relationshipName: string;
    linkage: Linkage;
};
export default class RemoveFromRelationshipQuery extends Query {
    protected query: {
        readonly using: QueryOptions['using'];
        readonly resourceId: RemoveFromRelationshipQueryOptions['resourceId'];
        readonly relationshipName: RemoveFromRelationshipQueryOptions['relationshipName'];
        readonly linkage: RemoveFromRelationshipQueryOptions['linkage'];
    };
    constructor(opts: RemoveFromRelationshipQueryOptions);
    readonly resourceId: string | number;
    readonly relationshipName: string;
    readonly linkage: Linkage;
}
