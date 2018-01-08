import Data from "../types/Generic/Data";
import Resource from "../types/Resource";
export declare function objectIsEmpty(obj: any): boolean;
export declare function mapObject(obj: any, mapFn: any): any;
export declare function groupResourcesByType(data: Data<Resource>): any;
export declare function forEachArrayOrVal(arrayOrVal: any, eachFn: any): void;
