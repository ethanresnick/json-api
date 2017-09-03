/// <reference types="mongoose" />
/// <reference types="pluralize" />
import mongodb = require("mongodb");
import mongoose = require("mongoose");
import pluralize = require("pluralize");
import Resource from "../../types/Resource";
import Collection from "../../types/Collection";
import FieldDocumentation from "../../types/Documentation/Field";
import { Adapter } from '../AdapterInterface';
import CreateQuery from "../../types/Query/CreateQuery";
import FindQuery from "../../types/Query/FindQuery";
import DeleteQuery from "../../types/Query/DeleteQuery";
import UpdateQuery from "../../types/Query/UpdateQuery";
import AddToRelationshipQuery from "../../types/Query/AddToRelationshipQuery";
import RemoveFromRelationshipQuery from "../../types/Query/RemoveFromRelationshipQuery";
export default class MongooseAdapter implements Adapter<typeof MongooseAdapter> {
    "constructor": typeof MongooseAdapter;
    models: {
        [modelName: string]: mongoose.Model<any>;
    };
    inflector: typeof pluralize;
    idGenerator: (doc: mongoose.Document) => mongodb.ObjectID;
    constructor(models?: {
        [modelName: string]: mongoose.Model<any>;
    }, inflector?: any, idGenerator?: any);
    find(query: FindQuery): Promise<void | [any, any, number | null]>;
    create(query: CreateQuery): Promise<void | Resource | Collection>;
    update(query: UpdateQuery): Promise<void | Resource | Collection>;
    delete(query: DeleteQuery): Promise<any>;
    addToRelationship(query: AddToRelationshipQuery): Promise<any>;
    removeFromRelationship(query: RemoveFromRelationshipQuery): Promise<any>;
    getModel(modelName: any): mongoose.Model<any>;
    getTypesAllowedInCollection(parentType: any): any[];
    getRelationshipNames(type: any): string[];
    doQuery(query: CreateQuery | FindQuery | UpdateQuery | DeleteQuery | AddToRelationshipQuery | RemoveFromRelationshipQuery): any;
    static docsToResourceOrCollection(docs: any, makeCollection: any, pluralizer: any, fields?: object): Collection | Resource;
    static docToResource(doc: any, pluralizer?: (word: string) => string, fields?: object): Resource;
    static getModelName(type: any, singularizer?: (word: string) => string): any;
    static getType(modelName: any, pluralizer?: (word: string) => string): string;
    static getReferencedType(model: any, path: any, pluralizer?: (word: string) => string): string;
    static getChildTypes(model: any, pluralizer?: (word: string) => string): string[];
    static getStandardizedSchema(model: any, pluralizer?: (word: string) => string): FieldDocumentation[];
    static toFriendlyName(pathOrModelName: string): string;
    static getIdQueryType(idOrIds: string | string[] | undefined): ["findOne", {
        _id: string;
    }] | ["find", {
        _id: {
            $in: string[];
        };
    }] | ["find", {}];
    static idIsValid(id: any): boolean;
}
