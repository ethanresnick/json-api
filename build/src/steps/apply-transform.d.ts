import Resource from "../types/Resource";
import Collection from "../types/Collection";
import Linkage from "../types/Linkage";
import ResourceTypeRegistry from "../ResourceTypeRegistry";
import { Request } from '../types/';
export declare type Transformable = Resource | Collection | Linkage | null | undefined;
export declare type Extras = {
    frameworkReq: any;
    frameworkRes: any;
    request: Request;
    registry: ResourceTypeRegistry;
};
export declare type TransformMode = 'beforeSave' | 'beforeRender';
export declare type TransformFn = (resource: Resource, frameworkReq: Extras['frameworkReq'], frameworkRes: Extras['frameworkRes'], superFn: (resource: Resource, req: Extras['frameworkReq'], res: Extras['frameworkRes'], extras: Extras) => Resource | undefined | Promise<Resource | undefined>, extras: Extras) => Resource | undefined | Promise<Resource | undefined>;
export default function <T extends Transformable>(toTransform: T, mode: TransformMode, extras: Extras): Promise<T>;
