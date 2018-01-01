"use strict";
const Document_1 = require("./types/Document");
const APIError_1 = require("./types/APIError");
const Resource_1 = require("./types/Resource");
const ResourceIdentifier_1 = require("./types/ResourceIdentifier");
const Relationship_1 = require("./types/Relationship");
const ResourceSet_1 = require("./types/ResourceSet");
const Field_1 = require("./types/Documentation/Field");
const FieldType_1 = require("./types/Documentation/FieldType");
const API_1 = require("./controllers/API");
const Documentation_1 = require("./controllers/Documentation");
const ResourceTypeRegistry_1 = require("./ResourceTypeRegistry");
const CreateQuery_1 = require("./types/Query/CreateQuery");
const FindQuery_1 = require("./types/Query/FindQuery");
const UpdateQuery_1 = require("./types/Query/UpdateQuery");
const DeleteQuery_1 = require("./types/Query/DeleteQuery");
const AddToRelationshipQuery_1 = require("./types/query/AddToRelationshipQuery");
const RemoveFromRelationshipQuery_1 = require("./types/Query/RemoveFromRelationshipQuery");
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
        ResourceIdentifier: ResourceIdentifier_1.default,
        ResourceSet: ResourceSet_1.default,
        Relationship: Relationship_1.default,
        Documentation: {
            Field: Field_1.default,
            FieldType: FieldType_1.default
        },
        Query: {
            Find: FindQuery_1.default,
            Create: CreateQuery_1.default,
            Update: UpdateQuery_1.default,
            Delete: DeleteQuery_1.default,
            AddToRelationship: AddToRelationshipQuery_1.default,
            RemoveFromRelationship: RemoveFromRelationshipQuery_1.default
        }
    },
    controllers: {
        API: API_1.default,
        Documentation: Documentation_1.default
    },
    ResourceTypeRegistry: ResourceTypeRegistry_1.default
};
