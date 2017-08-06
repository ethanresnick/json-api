export interface AdapterInstance<T extends new (...args) => any> {
    constructor: T;
    find(type: any, idOrIds: any, fields: any, sorts: any, filters: any, includePaths: any, offset: any, limit: any): any;
    create(parentType: any, resourceOrCollection: any): any;
    update(parentType: any, resourceOrCollection: any): any;
    delete(parentType: any, idOrIds: any): any;
    addToRelationship(type: any, id: any, relationshipPath: any, newLinkage: any): any;
    removeFromRelationship(type: any, id: any, relationshipPath: any, linkageToRemove: any): any;
    getModel(modelName: any): any;
    getTypesAllowedInCollection(parentType: any): any;
    getRelationshipNames(type: any): any;
}
export interface AdapterClass {
    new (...args: any[]): AdapterInstance<{
        new (...args): any;
    }>;
    getStandardizedSchema(model: any, pluralizer: any): any;
    getChildTypes(type: string): string[];
}
export interface Adapter<T extends AdapterClass> extends AdapterInstance<T> {
}
