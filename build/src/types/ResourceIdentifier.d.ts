export declare type ResourceIdentifierJSON = {
    type: string;
    id: string;
};
export default class ResourceIdentifier {
    type: string;
    id: string;
    constructor(type: string, id: string);
    toJSON(): {
        id: string;
        type: string;
    };
    static fromJSON(it: ResourceIdentifierJSON): ResourceIdentifier;
}
export declare function isValidLinkageObject(it: any): boolean;
