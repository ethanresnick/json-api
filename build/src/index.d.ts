import MongooseAdapter from "./db-adapters/Mongoose/MongooseAdapter";
import ExpressStrategy from "./http-strategies/Express";
import KoaStrategy from "./http-strategies/Koa";
import Document from './types/Document';
import Error, { displaySafe as displaySafeError } from './types/APIError';
import Resource from './types/Resource';
import ResourceIdentifier from './types/ResourceIdentifier';
import ResourceSet from './types/ResourceSet';
import Relationship from './types/Relationship';
import Field from './types/Documentation/Field';
import FieldType from './types/Documentation/FieldType';
import API from './controllers/API';
import Documentation from './controllers/Documentation';
import ResourceTypeRegistry from './ResourceTypeRegistry';
import CreateQuery from './types/Query/CreateQuery';
import FindQuery from './types/Query/FindQuery';
import UpdateQuery from './types/Query/UpdateQuery';
import DeleteQuery from './types/Query/DeleteQuery';
import AddToRelationshipQuery from './types/query/AddToRelationshipQuery';
import RemoveFromRelationshipQuery from './types/Query/RemoveFromRelationshipQuery';
export { FinalizedRequest as Request, Result, HTTPResponse } from './types';
export { Document, Error, Resource, ResourceIdentifier, ResourceSet, Relationship, API as APIController, Documentation as DocumentationController, CreateQuery, FindQuery, UpdateQuery, DeleteQuery, AddToRelationshipQuery, RemoveFromRelationshipQuery, Field, FieldType, ResourceTypeRegistry, displaySafeError };
export declare const dbAdapters: {
    readonly Mongoose: typeof MongooseAdapter;
};
export declare const httpStrategies: {
    readonly Express: typeof ExpressStrategy;
    readonly Koa: typeof KoaStrategy;
};
export declare const types: {
    Document: typeof Document;
    Error: typeof Error;
    Resource: typeof Resource;
    ResourceIdentifier: typeof ResourceIdentifier;
    ResourceSet: typeof ResourceSet;
    Relationship: typeof Relationship;
    Documentation: {
        Field: typeof Field;
        FieldType: typeof FieldType;
    };
    Query: {
        Find: typeof FindQuery;
        Create: typeof CreateQuery;
        Update: typeof UpdateQuery;
        Delete: typeof DeleteQuery;
        AddToRelationship: typeof AddToRelationshipQuery;
        RemoveFromRelationship: typeof RemoveFromRelationshipQuery;
    };
};
export declare const controllers: {
    API: typeof API;
    Documentation: typeof Documentation;
};
declare const defaultExp: {
    types: {
        Document: typeof Document;
        Error: typeof Error;
        Resource: typeof Resource;
        ResourceIdentifier: typeof ResourceIdentifier;
        ResourceSet: typeof ResourceSet;
        Relationship: typeof Relationship;
        Documentation: {
            Field: typeof Field;
            FieldType: typeof FieldType;
        };
        Query: {
            Find: typeof FindQuery;
            Create: typeof CreateQuery;
            Update: typeof UpdateQuery;
            Delete: typeof DeleteQuery;
            AddToRelationship: typeof AddToRelationshipQuery;
            RemoveFromRelationship: typeof RemoveFromRelationshipQuery;
        };
    };
    controllers: {
        API: typeof API;
        Documentation: typeof Documentation;
    };
    httpStrategies: {
        readonly Express: typeof ExpressStrategy;
        readonly Koa: typeof KoaStrategy;
    };
    dbAdapters: {
        readonly Mongoose: typeof MongooseAdapter;
    };
    displaySafeError: symbol;
};
export default defaultExp;
