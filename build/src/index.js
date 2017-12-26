"use strict";
const Document_1 = require("./types/Document");
const APIError_1 = require("./types/APIError");
const Resource_1 = require("./types/Resource");
const Relationship_1 = require("./types/Relationship");
const ResourceSet_1 = require("./types/ResourceSet");
const Field_1 = require("./types/Documentation/Field");
const FieldType_1 = require("./types/Documentation/FieldType");
const API_1 = require("./controllers/API");
const Documentation_1 = require("./controllers/Documentation");
const ResourceTypeRegistry_1 = require("./ResourceTypeRegistry");
module.exports = {
    dbAdapters: {
        get Mongoose() {
            return require('./db-adapters/Mongoose/MongooseAdapter').default;
        }
    },
    httpStrategies: {
        get Express() {
            return require('./http-strategies/Express').default;
        },
        get Koa() {
            return require('./http-strategies/Koa').default;
        }
    },
    types: {
        Document: Document_1.default,
        Error: APIError_1.default,
        Resource: Resource_1.default,
        ResourceSet: ResourceSet_1.default,
        Relationship: Relationship_1.default,
        Documentation: {
            Field: Field_1.default,
            FieldType: FieldType_1.default
        }
    },
    controllers: {
        API: API_1.default,
        Documentation: Documentation_1.default
    },
    ResourceTypeRegistry: ResourceTypeRegistry_1.default
};
