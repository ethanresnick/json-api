import Immutable = require("immutable");
import { TransformFn } from "./steps/apply-transform";
import { AdapterInstance } from "./db-adapters/AdapterInterface";
export declare type URLTemplates = {
    [type: string]: {
        [linkName: string]: string;
    };
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
    urlTemplates?: URLTemplates[keyof URLTemplates];
    beforeSave?: TransformFn;
    beforeRender?: TransformFn;
    labelMappers?: {
        [label: string]: any;
    };
    behaviors?: object;
};
export declare type ResourceTypeDescriptions = {
    [typeName: string]: ResourceTypeDescription;
};
export default class ResourceTypeRegistry {
    constructor(typeDescriptions?: ResourceTypeDescriptions, descriptionDefaults?: object | Immutable.Map<string, any>);
    type(typeName: any): ResourceTypeDescription | undefined;
    hasType(typeName: any): boolean;
    typeNames(): string[];
    urlTemplates(): URLTemplates;
    urlTemplates(type: string): URLTemplates[keyof URLTemplates];
    dbAdapter(type: any): AdapterInstance<any>;
    beforeSave(type: any): ResourceTypeDescription['beforeSave'] | undefined;
    beforeRender(type: any): ResourceTypeDescription['beforeRender'] | undefined;
    behaviors(type: any): any;
    labelMappers(type: any): ResourceTypeDescription['labelMappers'] | undefined;
    defaultIncludes(type: any): ResourceTypeDescription['defaultIncludes'] | undefined;
    info(type: any): ResourceTypeDescription['info'] | undefined;
    parentType(type: any): ResourceTypeDescription['parentType'] | undefined;
}
