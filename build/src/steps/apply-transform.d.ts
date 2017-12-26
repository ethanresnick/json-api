import ResourceTypeRegistry from "../ResourceTypeRegistry";
import { Request } from '../types/';
import Data from "../types/Data";
import Resource from "../types/Resource";
import ResourceIdentifier from "../types/ResourceIdentifier";
export declare type Extras = {
    frameworkReq: any;
    frameworkRes: any;
    request: Request;
    registry: ResourceTypeRegistry;
};
export declare type Transformable = Resource | ResourceIdentifier;
export declare type TransformMode = 'beforeSave' | 'beforeRender';
export declare type TransformFn<T> = (resourceOrIdentifier: T, frameworkReq: Extras['frameworkReq'], frameworkRes: Extras['frameworkRes'], superFn: TransformFn<T>, extras: Extras) => T | undefined | Promise<T | undefined>;
export declare type ResourceTransformFn = TransformFn<Resource>;
export declare type FullTransformFn = TransformFn<Transformable>;
export default function transform<T extends Transformable>(toTransform: Data<T>, mode: TransformMode, extras: Extras): Promise<Data<T>>;
