import Resource from "../types/Resource";
import Collection from "../types/Collection";
import Linkage from "../types/Linkage";
export declare type Transformable = Resource | Collection | Linkage | null | undefined;
export default function <T extends Transformable>(toTransform: T, mode: any, registry: any, frameworkReq: any, frameworkRes: any): Promise<T>;
