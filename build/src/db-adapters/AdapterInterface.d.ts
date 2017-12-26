import CreateQuery from "../types/Query/CreateQuery";
import FindQuery from "../types/Query/FindQuery";
import DeleteQuery from "../types/Query/DeleteQuery";
import UpdateQuery from "../types/Query/UpdateQuery";
import AddToRelationshipQuery from "../types/Query/AddToRelationshipQuery";
import RemoveFromRelationshipQuery from "../types/Query/RemoveFromRelationshipQuery";
export interface AdapterInstance<T extends new (...args: any[]) => any> {
    constructor: T;
    find(query: FindQuery): Promise<any[]>;
    create(query: CreateQuery): Promise<any>;
    update(update: UpdateQuery): Promise<any>;
    delete(query: DeleteQuery): Promise<any>;
    addToRelationship(query: AddToRelationshipQuery): Promise<any>;
    removeFromRelationship(query: RemoveFromRelationshipQuery): Promise<any>;
    getModel(modelName: any): any;
    getTypesAllowedInCollection(parentType: any): any;
    getRelationshipNames(type: any): any;
    doQuery(query: any): Promise<any>;
}
export interface AdapterClass {
    new (...args: any[]): AdapterInstance<{
        new (...args: any[]): any;
    }>;
    getStandardizedSchema(model: any, pluralizer: any): any;
    getChildTypes(type: string): string[];
    unaryFilterOperators: string[];
    binaryFilterOperators: string[];
}
export interface Adapter<T extends AdapterClass> extends AdapterInstance<T> {
}
