import Immutable = require("immutable");
import { ResourceTransformFn, FullTransformFn, TransformFn } from "./steps/apply-transform";
import { AdapterInstance } from "./db-adapters/AdapterInterface";
import Resource from "./types/Resource";
import ResourceIdentifier from "./types/ResourceIdentifier";
export { Resource, ResourceIdentifier, TransformFn };
export declare type URLTemplates = {
    [type: string]: URLTemplatesForType;
};
export declare type URLTemplatesForType = {
    [linkName: string]: string;
};
export declare type ResourceTypeInfo = {
    fields?: {
        [fieldName: string]: any;
    };
    example?: string;
    description?: string;
};
export declare type ResourceTypeDescription = {
    dbAdapter?: AdapterInstance<any>;
    info?: ResourceTypeInfo;
    defaultIncludes?: string[];
    parentType?: string;
    urlTemplates?: URLTemplatesForType;
    beforeSave?: ResourceTransformFn | FullTransformFn;
    beforeRender?: ResourceTransformFn | FullTransformFn;
    behaviors?: object;
    transformLinkage?: boolean;
};
export declare type ResourceTypeDescriptions = {
    [typeName: string]: ResourceTypeDescription;
};
export default class ResourceTypeRegistry {
    private _types;
    constructor(typeDescs?: ResourceTypeDescriptions, descDefaults?: object | Immutable.Map<string, any>);
    type(typeName: any): ResourceTypeDescription | undefined;
    hasType(typeName: any): boolean;
    typeNames(): string[];
    urlTemplates(): URLTemplates;
    urlTemplates(type: string): URLTemplatesForType;
    dbAdapter(type: any): AdapterInstance<any>;
    beforeSave(type: any): TransformFn<Resource> | TransformFn<Resource | ResourceIdentifier> | undefined;
    beforeRender(type: any): TransformFn<Resource> | TransformFn<Resource | ResourceIdentifier> | undefined;
    behaviors(type: any): object | undefined;
    defaultIncludes(type: any): string[] | undefined;
    info(type: any): ResourceTypeInfo | undefined;
    parentType(type: any): string | undefined;
    transformLinkage(type: any): boolean;
    private doGet<T>(attrName, type);
}
