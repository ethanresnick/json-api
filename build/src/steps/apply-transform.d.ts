import ResourceTypeRegistry from "../ResourceTypeRegistry";
import { FinalizedRequest, ServerReq, ServerRes } from '../types/';
import Data from "../types/Generic/Data";
import Resource from "../types/Resource";
import ResourceIdentifier from "../types/ResourceIdentifier";
export declare type Extras = {
    request: FinalizedRequest;
    serverReq: ServerReq;
    serverRes: ServerRes;
    frameworkReq?: ServerReq;
    frameworkRes?: ServerRes;
    registry: ResourceTypeRegistry;
};
export declare type Transformable = Resource | ResourceIdentifier;
export declare type TransformMode = 'beforeSave' | 'beforeRender';
export declare type TransformFn<T> = (resourceOrIdentifier: T, serverReq: Extras['serverReq'], serverRes: Extras['serverRes'], superFn: TransformFn<T>, extras: Extras) => T | undefined | Promise<T | undefined>;
export declare type ResourceTransformFn = TransformFn<Resource>;
export declare type FullTransformFn = TransformFn<Transformable>;
export default function transform<T extends Transformable>(toTransform: Data<T>, mode: TransformMode, extras: Extras): Promise<Data<T>>;
