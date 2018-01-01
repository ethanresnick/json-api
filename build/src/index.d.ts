import MongooseAdapter from "./db-adapters/Mongoose/MongooseAdapter";
import ExpressStrategy from "./http-strategies/Express";
import KoaStrategy from "./http-strategies/Koa";
import Document from './types/Document';
import Error from './types/APIError';
import Resource from './types/Resource';
import ResourceIdentifier from './types/ResourceIdentifier';
import Relationship from './types/Relationship';
import ResourceSet from './types/ResourceSet';
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
declare const _default: {
    dbAdapters: {
        readonly Mongoose: typeof MongooseAdapter;
    };
    httpStrategies: {
        readonly Express: typeof ExpressStrategy;
        readonly Koa: typeof KoaStrategy;
    };
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
    ResourceTypeRegistry: typeof ResourceTypeRegistry;
};
export = _default;
