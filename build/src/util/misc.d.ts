export declare function deleteNested(path: any, object: any): boolean;
export declare function isSubsetOf(setArr: any, potentialSubsetArr: any): any;
export declare function isPlainObject(obj: any): boolean;
export declare function pseudoTopSort(nodes: any, edges: {
    [from: string]: {
        [to: string]: true;
    };
}, roots: any): string[];
