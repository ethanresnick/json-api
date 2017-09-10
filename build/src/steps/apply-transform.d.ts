import Resource from "../types/Resource";
import Collection from "../types/Collection";
import Linkage from "../types/Linkage";
import ResourceTypeRegistry from "../ResourceTypeRegistry";
export declare type Transformable = Resource | Collection | Linkage | null | undefined;
export declare type Extras = {
    frameworkReq: any;
    frameworkRes: any;
    request: any;
};
export declare type TransformMode = 'beforeSave' | 'beforeRender';
export default function <T extends Transformable>(toTransform: T, mode: TransformMode, registry: ResourceTypeRegistry, extras: Extras): Promise<T>;
