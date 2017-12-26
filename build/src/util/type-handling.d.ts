import Data from "../types/Data";
import Resource from "../types/Resource";
export declare function objectIsEmpty(obj: any): boolean;
export declare function mapObject(obj: any, mapFn: any): any;
export declare function groupResourcesByType(data: Data<Resource>): any;
export declare function forEachArrayOrVal(arrayOrVal: any, eachFn: any): void;
export declare type Maybe<U> = Just<U> | Nothing<U>;
export declare class Nothing<T> {
    getOrDefault(defaultVal?: T): T | undefined;
    bind<U>(transform: (v: T) => Maybe<U> | U | undefined): Maybe<U>;
    map<U>(transform: (v: T) => U | undefined): Maybe<U>;
}
export declare class Just<T> {
    private val;
    constructor(x: T);
    getOrDefault(defaultVal?: T): T | undefined;
    map<U>(transform: (v: T) => U | undefined): Maybe<U>;
    bind<U>(transform: (v: T) => Maybe<U> | U | undefined): Maybe<U>;
}
export declare function Maybe<T>(x: T | undefined): Maybe<T>;
