export declare type Ugh<T> = {
    new (initial?: Partial<T>): T;
    (initial?: Partial<T>): T;
};
export declare function ValueObject<T extends object>(ConstructorFn: {
    new (): T;
}): Ugh<T>;
export declare function objectIsEmpty(obj: any): boolean;
export declare function mapObject(obj: any, mapFn: any): any;
export declare function mapResources(resourceOrCollection: any, mapFn: any): any;
export declare function forEachResources(resourceOrCollection: any, eachFn: any): any;
export declare function groupResourcesByType(resourceOrCollection: any): any;
export declare function forEachArrayOrVal(arrayOrVal: any, eachFn: any): void;
export declare const Nothing: {
    unwrap(): undefined;
    bind(transform: any): any;
};
export declare class Just {
    private val;
    constructor(x: any);
    unwrap(): any;
    bind(transform: any): any;
}
export declare function Maybe(x: any): Just | typeof Nothing;
