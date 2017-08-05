import Immutable = require("immutable");
export declare type ResourceTypeInfo = {
    fields?: {
        [fieldName: string]: any;
    };
    example?: string;
    description?: string;
};
export declare type DefaultIncludes = string[];
export default class ResourceTypeRegistry {
    constructor(typeDescriptions?: object, descriptionDefaults?: object | Immutable.Map<string, any>);
    type(typeName: any): any;
    hasType(typeName: any): boolean;
    typeNames(): string[];
    urlTemplates(): URLTemplates;
    urlTemplates(type: string): URLTemplates[keyof URLTemplates];
    dbAdapter(type: any): any;
    beforeSave(type: any): Function | undefined;
    beforeRender(type: any): Function | undefined;
    behaviors(type: any): any;
    labelMappers(type: any): any;
    defaultIncludes(type: any): DefaultIncludes;
    info(type: any): ResourceTypeInfo | undefined;
    parentType(type: any): string;
}
export declare type URLTemplates = {
    [type: string]: {
        [linkName: string]: string;
    };
};
