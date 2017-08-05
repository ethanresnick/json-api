import Relationship, { RelationshipJSON } from './Relationship';
export declare type ResourceJSON = {
    id: string;
    type: string;
    attributes?: object;
    relationships?: {
        [name: string]: RelationshipJSON;
    };
    meta?: object;
    links?: {
        self?: string;
    };
};
export declare type ResourceWithId = Resource & {
    id: string;
};
export default class Resource {
    private _id;
    private _type;
    private _relationships;
    private _attrs;
    meta: object;
    constructor(type: string, id?: string, attrs?: {}, relationships?: {}, meta?: object);
    id: string | undefined;
    type: string;
    equals(otherResource: any): boolean;
    attrs: {
        [name: string]: any;
    };
    relationships: {
        [name: string]: Relationship;
    };
    removeAttr(attrPath: any): void;
    removeRelationship(relationshipPath: any): void;
}
