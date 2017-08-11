import MongooseAdapter from "./db-adapters/Mongoose/MongooseAdapter";
import ExpressStrategy from "./http-strategies/Express";
import KoaStrategy from "./http-strategies/Koa";
import Collection from './types/Collection';
import Document from './types/Document';
import Error from './types/APIError';
import Resource from './types/Resource';
import Relationship from './types/Relationship';
import Linkage from './types/Linkage';
import Field from './types/Documentation/Field';
import FieldType from './types/Documentation/FieldType';
import API from './controllers/API';
import Documentation from './controllers/Documentation';
import ResourceTypeRegistry from './ResourceTypeRegistry';
declare const _default: {
    dbAdapters: {
        readonly Mongoose: typeof MongooseAdapter;
    };
    httpStrategies: {
        readonly Express: typeof ExpressStrategy;
        readonly Koa: typeof KoaStrategy;
    };
    types: {
        Collection: typeof Collection;
        Document: typeof Document;
        Error: typeof Error;
        Resource: typeof Resource;
        Relationship: typeof Relationship;
        Linkage: typeof Linkage;
        Documentation: {
            Field: typeof Field;
            FieldType: typeof FieldType;
        };
    };
    controllers: {
        API: typeof API;
        Documentation: typeof Documentation;
    };
    ResourceTypeRegistry: typeof ResourceTypeRegistry;
};
export = _default;
