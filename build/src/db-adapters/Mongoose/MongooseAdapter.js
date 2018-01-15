"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose = require("mongoose");
const pluralize = require("pluralize");
const misc_1 = require("../../util/misc");
const objectValueEntries_1 = require("../../util/objectValueEntries");
const type_handling_1 = require("../../util/type-handling");
const util = require("./lib");
const Data_1 = require("../../types/Generic/Data");
const Resource_1 = require("../../types/Resource");
const ResourceIdentifier_1 = require("../../types/ResourceIdentifier");
const Relationship_1 = require("../../types/Relationship");
const APIError_1 = require("../../types/APIError");
const Field_1 = require("../../types/Documentation/Field");
const FieldType_1 = require("../../types/Documentation/FieldType");
const RelationshipType_1 = require("../../types/Documentation/RelationshipType");
const CreateQuery_1 = require("../../types/Query/CreateQuery");
const FindQuery_1 = require("../../types/Query/FindQuery");
const DeleteQuery_1 = require("../../types/Query/DeleteQuery");
const UpdateQuery_1 = require("../../types/Query/UpdateQuery");
const AddToRelationshipQuery_1 = require("../../types/Query/AddToRelationshipQuery");
const RemoveFromRelationshipQuery_1 = require("../../types/Query/RemoveFromRelationshipQuery");
class MongooseAdapter {
    constructor(models, inflector, idGenerator) {
        this.models = models || mongoose.models;
        this.inflector = inflector || pluralize;
        this.idGenerator = idGenerator;
    }
    find(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, populates: includePaths, select: fields, sort: sorts, offset, limit, singular } = query;
            const mode = singular ? 'findOne' : 'find';
            const filters = query.getFilters();
            const mongofiedFilters = util.toMongoCriteria(filters);
            const model = this.getModel(this.constructor.getModelName(type));
            const pluralizer = this.inflector.plural;
            this.constructor.assertIdsValid(filters, singular);
            const isPaginating = mode !== 'findOne' &&
                (typeof offset !== 'undefined' || typeof limit !== 'undefined');
            let primaryDocumentsPromise, includedResourcesPromise;
            const queryBuilder = mode === 'findOne'
                ? model[mode](mongofiedFilters)
                : model[mode](mongofiedFilters);
            const collectionSizePromise = isPaginating
                ? model.count(mongofiedFilters).exec()
                : Promise.resolve(null);
            if (Array.isArray(sorts)) {
                queryBuilder.sort(sorts.map(it => (it.direction === 'DESC' ? '-' : '') + it.field).join(" "));
            }
            if (offset) {
                queryBuilder.skip(offset);
            }
            if (limit) {
                queryBuilder.limit(limit);
            }
            if (includePaths && includePaths.length > 0) {
                const populatedPaths = [];
                const refPaths = util.getReferencePaths(model);
                includePaths.map((it) => it.split(".")).forEach((pathParts) => {
                    if (!refPaths.includes(pathParts[0])) {
                        const title = "Invalid include path.";
                        const detail = `Resources of type "${type}" don't have a(n) "${pathParts[0]}" relationship.`;
                        throw new APIError_1.default(400, undefined, title, detail);
                    }
                    if (pathParts.length > 1) {
                        throw new APIError_1.default(501, undefined, "Multi-level include paths aren't yet supported.");
                    }
                    populatedPaths.push(pathParts[0]);
                    queryBuilder.populate(pathParts[0]);
                });
                let includedResources = [];
                primaryDocumentsPromise = Promise.resolve(queryBuilder.exec()).then((docOrDocs) => {
                    includedResources =
                        objectValueEntries_1.values(Data_1.default.fromJSON(docOrDocs)
                            .flatMap((doc) => {
                            return Data_1.default.of(populatedPaths).flatMap((path) => {
                                return typeof doc[path] === 'undefined'
                                    ? Data_1.default.empty
                                    : Data_1.default.fromJSON(doc[path]).map(doc => {
                                        return this.constructor.docToResource(doc, pluralizer, fields);
                                    });
                            });
                        })
                            .values
                            .reduce((acc, resource) => {
                            acc[`${resource.type}/${resource.id}`] = resource;
                            return acc;
                        }, {}));
                    return docOrDocs;
                });
                includedResourcesPromise =
                    primaryDocumentsPromise.then(() => includedResources);
            }
            else {
                primaryDocumentsPromise = Promise.resolve(queryBuilder.exec());
                includedResourcesPromise = Promise.resolve(undefined);
            }
            return Promise.all([
                primaryDocumentsPromise.then((it) => {
                    return this.constructor.docsToResourceData(it, mode === 'find', pluralizer, fields);
                }),
                includedResourcesPromise,
                collectionSizePromise
            ])
                .catch(util.errorHandler);
        });
    }
    create(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { records: resourceData } = query;
            const resourcesByType = type_handling_1.groupResourcesByType(resourceData);
            const creationPromises = [];
            const setIdWithGenerator = (doc) => { doc._id = this.idGenerator(doc); };
            for (const type in resourcesByType) {
                const model = this.getModel(this.constructor.getModelName(type));
                const resources = resourcesByType[type];
                const docObjects = resources.map(util.resourceToDocObject);
                if (typeof this.idGenerator === "function") {
                    type_handling_1.forEachArrayOrVal(docObjects, setIdWithGenerator);
                }
                creationPromises.push(model.create(docObjects));
            }
            return Promise.all(creationPromises).then((docArrays) => {
                const makeCollection = !resourceData.isSingular;
                const finalDocs = docArrays.reduce((a, b) => a.concat(b), []);
                return this.constructor.docsToResourceData(finalDocs, makeCollection, this.inflector.plural);
            }).catch(util.errorHandler);
        });
    }
    update(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type: parentType, patch: resourceData } = query;
            const singular = this.inflector.singular;
            const plural = this.inflector.plural;
            const parentModel = this.getModel(this.constructor.getModelName(parentType, singular));
            const updateOptions = {
                new: true,
                runValidators: true,
                context: 'query',
                upsert: false
            };
            return resourceData.map((resourceUpdate) => {
                const newModelName = this.constructor.getModelName(resourceUpdate.type, singular);
                const NewModelConstructor = this.getModel(newModelName);
                const changeSet = util.resourceToDocObject(resourceUpdate);
                const updateDoc = NewModelConstructor.hydrate({}).set(changeSet);
                const modifiedPaths = updateDoc.modifiedPaths();
                const updateDocObject = updateDoc.toObject();
                const finalUpdate = modifiedPaths.reduce((acc, key) => {
                    acc[key] = updateDocObject[key];
                    return acc;
                }, {});
                return parentModel
                    .findByIdAndUpdate(resourceUpdate.id, finalUpdate, updateOptions)
                    .exec();
            }).flatMapAsync(docPromise => {
                return docPromise.then(doc => {
                    return this.constructor.docsToResourceData(doc, false, plural);
                });
            }).catch(util.errorHandler);
        });
    }
    delete(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type: parentType, singular } = query;
            const mode = singular ? 'findOne' : 'find';
            const filters = query.getFilters();
            const mongofiedFilters = util.toMongoCriteria(filters);
            const model = this.getModel(this.constructor.getModelName(parentType));
            this.constructor.assertIdsValid(filters, singular);
            if (!filters.value.length) {
                throw new APIError_1.default(400, undefined, "You must specify some resources to delete");
            }
            const queryBuilder = mode === 'findOne'
                ? model[mode](mongofiedFilters)
                : model[mode](mongofiedFilters);
            return Promise.resolve(queryBuilder.exec()).then((docOrDocsOrNull) => {
                const data = Data_1.default.fromJSON(docOrDocsOrNull);
                if (data.size === 0) {
                    throw new APIError_1.default(404, undefined, "No matching resource found.");
                }
                data.forEach(it => { it.remove(); });
                return data.map((it) => {
                    return this.constructor.docToResource(it, this.inflector.plural);
                });
            }).catch(util.errorHandler);
        });
    }
    addToRelationship(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id, relationshipName, linkage: newLinkage } = query;
            const model = this.getModel(this.constructor.getModelName(type));
            const update = {
                $addToSet: {
                    [relationshipName]: { $each: newLinkage.map(it => it.id).values }
                }
            };
            const options = { runValidators: true, context: 'query' };
            return model.findOneAndUpdate({ "_id": id }, update, options).exec()
                .catch(util.errorHandler);
        });
    }
    removeFromRelationship(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const { type, id, relationshipName, linkage: linkageToRemove } = query;
            const model = this.getModel(this.constructor.getModelName(type));
            const update = {
                $pullAll: {
                    [relationshipName]: linkageToRemove.map(it => it.id).values
                }
            };
            const options = { runValidators: true, context: 'query' };
            return model.findOneAndUpdate({ "_id": id }, update, options).exec()
                .catch(util.errorHandler);
        });
    }
    getModel(modelName) {
        if (!this.models[modelName]) {
            const err = new Error(`The model "${modelName}" has not been registered with the MongooseAdapter.`);
            err.status = 404;
            throw err;
        }
        return this.models[modelName];
    }
    getTypesAllowedInCollection(parentType) {
        const parentModel = this.getModel(this.constructor.getModelName(parentType, this.inflector.singular));
        return [parentType].concat(this.constructor.getChildTypes(parentModel, this.inflector.plural));
    }
    getRelationshipNames(type) {
        const model = this.getModel(this.constructor.getModelName(type, this.inflector.singular));
        return util.getReferencePaths(model);
    }
    doQuery(query) {
        const method = ((query instanceof CreateQuery_1.default && this.create) ||
            (query instanceof FindQuery_1.default && this.find) ||
            (query instanceof DeleteQuery_1.default && this.delete) ||
            (query instanceof UpdateQuery_1.default && this.update) ||
            (query instanceof AddToRelationshipQuery_1.default && this.addToRelationship) ||
            (query instanceof RemoveFromRelationshipQuery_1.default && this.removeFromRelationship));
        if (!method) {
            throw new Error("Unexpected query type.");
        }
        return method.call(this, query);
    }
    static docsToResourceData(docs, isPlural, pluralizer, fields) {
        if (!docs || (!isPlural && Array.isArray(docs) && docs.length === 0)) {
            throw new APIError_1.default(404, undefined, "No matching resource found.");
        }
        docs = !Array.isArray(docs) ? [docs] : docs;
        docs = docs.map((it) => this.docToResource(it, pluralizer, fields));
        return isPlural ? Data_1.default.of(docs) : Data_1.default.pure(docs[0]);
    }
    static docToResource(doc, pluralizer = pluralize.plural, fields) {
        const type = this.getType(doc.constructor.modelName, pluralizer);
        const refPaths = util.getReferencePaths(doc.constructor);
        const schemaOptions = doc.constructor.schema.options;
        let attrs = doc.toJSON({ virtuals: true, getters: true });
        delete attrs.id;
        delete attrs._id;
        delete attrs[schemaOptions.versionKey];
        delete attrs[schemaOptions.discriminatorKey];
        if (fields && fields[type]) {
            const newAttrs = {};
            fields[type].forEach((field) => {
                if (attrs[field]) {
                    newAttrs[field] = attrs[field];
                }
            });
            attrs = newAttrs;
        }
        const relationships = {};
        const getProp = (obj, part) => obj[part];
        refPaths.forEach((path) => {
            if (fields && fields[type] && !fields[type].includes(path)) {
                return;
            }
            const pathParts = path.split(".");
            let jsonValAtPath = pathParts.reduce(getProp, attrs);
            const referencedType = this.getReferencedType(doc.constructor, path);
            misc_1.deleteNested(path, attrs);
            const normalizedValAtPath = typeof jsonValAtPath === 'undefined' ? null : jsonValAtPath;
            const linkage = Data_1.default.fromJSON(normalizedValAtPath).map((docOrId) => {
                return new ResourceIdentifier_1.default(referencedType, String(docOrId._id ? docOrId._id : docOrId));
            });
            relationships[path] = Relationship_1.default.of({
                data: linkage,
                owner: { type, id: doc.id, path }
            });
        });
        return new Resource_1.default(type, doc.id, attrs, relationships);
    }
    static getModelName(type, singularizer = pluralize.singular) {
        const words = type.split("-");
        words[words.length - 1] = singularizer(words[words.length - 1]);
        return words.map((it) => it.charAt(0).toUpperCase() + it.slice(1)).join("");
    }
    static getType(modelName, pluralizer = pluralize.plural) {
        return pluralizer(modelName.replace(/([A-Z])/g, "\-$1").slice(1).toLowerCase());
    }
    static getReferencedType(model, path, pluralizer = pluralize.plural) {
        return this.getType(util.getReferencedModelName(model, path), pluralizer);
    }
    static getChildTypes(model, pluralizer = pluralize.plural) {
        if (!model.discriminators) {
            return [];
        }
        return Object.keys(model.discriminators).map(it => this.getType(it, pluralizer));
    }
    static getStandardizedSchema(model, pluralizer = pluralize.plural) {
        const schemaOptions = model.schema.options;
        const versionKey = schemaOptions.versionKey;
        const discriminatorKey = schemaOptions.discriminatorKey;
        const virtuals = model.schema.virtuals;
        const schemaFields = [];
        const getFieldType = (path, schemaType) => {
            if (path === "_id") {
                return new FieldType_1.default("Id", false);
            }
            const typeOptions = schemaType.options.type;
            const holdsArray = Array.isArray(typeOptions);
            const baseType = holdsArray ? typeOptions[0].ref : typeOptions.name;
            const refModelName = util.getReferencedModelName(model, path);
            return !refModelName ?
                new FieldType_1.default(baseType, holdsArray) :
                new RelationshipType_1.default(holdsArray, refModelName, this.getType(refModelName, pluralizer));
        };
        model.schema.eachPath((name, type) => {
            if ([versionKey, discriminatorKey].includes(name)) {
                return;
            }
            const fieldType = getFieldType(name, type);
            name = (name === "_id") ? "id" : name;
            const likelyAutoGenerated = name === "id" || (fieldType.baseType === "Date" &&
                /created|updated|modified/.test(name) &&
                typeof type.options.default === "function");
            let defaultVal;
            if (likelyAutoGenerated) {
                defaultVal = "__AUTO__";
            }
            else if (type.options.default && typeof type.options.default !== "function") {
                defaultVal = type.options.default;
            }
            const baseTypeOptions = Array.isArray(type.options.type) ? type.options.type[0] : type.options;
            const validationRules = {
                required: !!type.options.required,
                oneOf: baseTypeOptions.enum ? type.enumValues || (type.caster && type.caster.enumValues) : undefined,
                max: type.options.max || undefined
            };
            type.validators.forEach((validatorObj) => {
                Object.assign(validationRules, validatorObj.validator.JSONAPIDocumentation);
            });
            schemaFields.push(new Field_1.default(name, fieldType, validationRules, this.toFriendlyName(name), defaultVal));
        });
        for (const virtual in virtuals) {
            if (virtual === "id") {
                continue;
            }
            schemaFields.push(new Field_1.default(virtual, undefined, undefined, this.toFriendlyName(virtual)));
        }
        return schemaFields;
    }
    static toFriendlyName(pathOrModelName) {
        const ucFirst = (v) => v.charAt(0).toUpperCase() + v.slice(1);
        const pascalCasedString = pathOrModelName.split(".").map(ucFirst).join("");
        let matches;
        const words = [];
        const wordsRe = /[A-Z]([A-Z]*(?![^A-Z])|[^A-Z]*)/g;
        while ((matches = wordsRe.exec(pascalCasedString)) !== null) {
            words.push(matches[0]);
        }
        return words.join(" ");
    }
    static assertIdsValid(filters, isSingular) {
        const idsArray = filters.value.reduce((acc, filter) => {
            return filter.field === 'id'
                ? acc.concat(filter.value)
                : acc;
        }, []);
        if (!idsArray.every(this.idIsValid)) {
            throw isSingular
                ? new APIError_1.default(404, undefined, "No matching resource found.", "Invalid ID.")
                : new APIError_1.default(400, undefined, "Invalid ID.");
        }
    }
    static idIsValid(id) {
        return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    }
}
MongooseAdapter.unaryFilterOperators = ["and", "or"];
MongooseAdapter.binaryFilterOperators = ['eq', 'neq', 'ne', 'in', 'nin', 'lt', 'gt', 'lte', 'gte'];
exports.default = MongooseAdapter;
