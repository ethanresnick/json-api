export default class ResourceIdentifier {
    type: string;
    id: string;
    constructor(it: {
        type: string;
        id: string;
    });
    toJSON(): {
        id: string;
        type: string;
    };
}
export declare function isValidLinkageObject(it: any): boolean;
