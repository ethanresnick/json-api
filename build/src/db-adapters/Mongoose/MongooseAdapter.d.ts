/// <reference types="mongoose" />
/// <reference types="pluralize" />
/// <reference types="q" />
import Q = require("q");
import mongodb = require("mongodb");
import mongoose = require("mongoose");
import pluralize = require("pluralize");
import Resource from "../../types/Resource";
import Collection from "../../types/Collection";
import FieldDocumentation from "../../types/Documentation/Field";
import { Adapter } from '../AdapterInterface';
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
    find(type: any, idOrIds: string | string[] | undefined, fields: any, sorts: any, filters: any, includePaths: any): Q.Promise<void>;
    create(parentType: any, resourceOrCollection: any): Promise<void | Resource | Collection>;
    update(parentType: any, resourceOrCollection: any): Q.Promise<void>;
    delete(parentType: any, idOrIds: any): Q.Promise<void> | Q.Promise<{}>;
    addToRelationship(type: any, id: any, relationshipPath: any, newLinkage: any): Q.Promise<void>;
    removeFromRelationship(type: any, id: any, relationshipPath: any, linkageToRemove: any): Q.Promise<void>;
    getModel(modelName: any): mongoose.Model<any>;
    getTypesAllowedInCollection(parentType: any): any[];
    getRelationshipNames(type: any): string[];
    static docsToResourceOrCollection(docs: any, makeCollection: any, pluralizer: any, fields?: object): Collection | Resource;
    static docToResource(doc: any, pluralizer?: (word: string) => string, fields?: object): Resource;
    static getModelName(type: any, singularizer?: (word: string) => string): any;
    static getType(modelName: any, pluralizer?: (word: string) => string): string;
    static getReferencedType(model: any, path: any, pluralizer?: (word: string) => string): string;
    static getChildTypes(model: any, pluralizer?: (word: string) => string): string[];
    static getStandardizedSchema(model: any, pluralizer?: (word: string) => string): FieldDocumentation[];
    static toFriendlyName(pathOrModelName: string): string;
    static getIdQueryType(idOrIds?: string | string[] | undefined): ["findOne", {
        _id: string;
    }] | ["find", {
        _id: {
            $in: string[];
        };
    }] | ["find", {}];
    static idIsValid(id: any): boolean;
}
