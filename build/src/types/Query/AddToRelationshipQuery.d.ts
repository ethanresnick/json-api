import Query, { QueryOptions } from "./Query";
import Linkage from '../Linkage';
export declare type AddToRelationshipQueryOptions = QueryOptions & {
    id: string | number;
    relationshipName: string;
    linkage: Linkage;
};
export default class AddToRelationshipQuery extends Query {
    protected query: {
        readonly type: QueryOptions['type'];
        readonly returning: QueryOptions['returning'];
        readonly catch: QueryOptions['catch'];
        readonly id: AddToRelationshipQueryOptions['id'];
        readonly relationshipName: AddToRelationshipQueryOptions['relationshipName'];
        readonly linkage: AddToRelationshipQueryOptions['linkage'];
    };
    constructor(opts: AddToRelationshipQueryOptions);
    readonly id: string | number;
    readonly relationshipName: string;
    readonly linkage: Linkage;
}
