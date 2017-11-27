import Query, { QueryOptions } from "./Query";
import Linkage from '../Linkage';
export declare type AddToRelationshipQueryOptions = QueryOptions & {
    id: string | number;
    relationshipName: string;
    linkage: Linkage;
};
export default class AddToRelationshipQuery extends Query {
    protected query: {
        type: QueryOptions['type'];
        returning: QueryOptions['returning'];
        catch: QueryOptions['catch'];
        id: AddToRelationshipQueryOptions['id'];
        relationshipName: AddToRelationshipQueryOptions['relationshipName'];
        linkage: AddToRelationshipQueryOptions['linkage'];
    };
    constructor(opts: AddToRelationshipQueryOptions);
    readonly id: string | number;
    readonly relationshipName: string;
    readonly linkage: Linkage;
}
