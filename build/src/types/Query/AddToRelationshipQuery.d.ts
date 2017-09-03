import Query, { QueryOptions } from "./Query";
import Linkage from '../Linkage';
export declare type AddToRelationshipQueryOptions = QueryOptions & {
    resourceId: string | number;
    relationshipName: string;
    linkage: Linkage;
};
export default class AddToRelationshipQuery extends Query {
    protected query: {
        readonly using: QueryOptions['using'];
        readonly resourceId: AddToRelationshipQueryOptions['resourceId'];
        readonly relationshipName: AddToRelationshipQueryOptions['relationshipName'];
        readonly linkage: AddToRelationshipQueryOptions['linkage'];
    };
    constructor(opts: AddToRelationshipQueryOptions);
    readonly resourceId: string | number;
    readonly relationshipName: string;
    readonly linkage: Linkage;
}
