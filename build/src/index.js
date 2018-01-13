"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Document_1 = require("./types/Document");
exports.Document = Document_1.default;
const APIError_1 = require("./types/APIError");
exports.Error = APIError_1.default;
exports.displaySafeError = APIError_1.displaySafe;
const Resource_1 = require("./types/Resource");
exports.Resource = Resource_1.default;
const ResourceIdentifier_1 = require("./types/ResourceIdentifier");
exports.ResourceIdentifier = ResourceIdentifier_1.default;
const ResourceSet_1 = require("./types/ResourceSet");
exports.ResourceSet = ResourceSet_1.default;
const Relationship_1 = require("./types/Relationship");
exports.Relationship = Relationship_1.default;
const Field_1 = require("./types/Documentation/Field");
exports.Field = Field_1.default;
const FieldType_1 = require("./types/Documentation/FieldType");
exports.FieldType = FieldType_1.default;
const API_1 = require("./controllers/API");
exports.APIController = API_1.default;
const Documentation_1 = require("./controllers/Documentation");
exports.DocumentationController = Documentation_1.default;
const ResourceTypeRegistry_1 = require("./ResourceTypeRegistry");
exports.ResourceTypeRegistry = ResourceTypeRegistry_1.default;
const CreateQuery_1 = require("./types/Query/CreateQuery");
exports.CreateQuery = CreateQuery_1.default;
const FindQuery_1 = require("./types/Query/FindQuery");
exports.FindQuery = FindQuery_1.default;
const UpdateQuery_1 = require("./types/Query/UpdateQuery");
exports.UpdateQuery = UpdateQuery_1.default;
const DeleteQuery_1 = require("./types/Query/DeleteQuery");
exports.DeleteQuery = DeleteQuery_1.default;
const AddToRelationshipQuery_1 = require("./types/query/AddToRelationshipQuery");
exports.AddToRelationshipQuery = AddToRelationshipQuery_1.default;
const RemoveFromRelationshipQuery_1 = require("./types/Query/RemoveFromRelationshipQuery");
exports.RemoveFromRelationshipQuery = RemoveFromRelationshipQuery_1.default;
exports.dbAdapters = {
    get Mongoose() {
        return require('./db-adapters/Mongoose/MongooseAdapter').default;
    }
};
exports.httpStrategies = {
    get Express() {
        return require('./http-strategies/Express').default;
    },
    get Koa() {
        return require('./http-strategies/Koa').default;
    }
};
exports.types = {
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
};
exports.controllers = {
    API: API_1.default,
    Documentation: Documentation_1.default
};
const defaultExp = { types: exports.types, controllers: exports.controllers, httpStrategies: exports.httpStrategies, dbAdapters: exports.dbAdapters, displaySafeError: APIError_1.displaySafe };
exports.default = defaultExp;
