"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const mongoose = require("mongoose");
const pluralize = require("pluralize");
const arrays_1 = require("../../util/arrays");
const misc_1 = require("../../util/misc");
const type_handling_1 = require("../../util/type-handling");
const util = require("./lib");
const Resource_1 = require("../../types/Resource");
const Collection_1 = require("../../types/Collection");
const Linkage_1 = require("../../types/Linkage");
const Relationship_1 = require("../../types/Relationship");
const APIError_1 = require("../../types/APIError");
const Field_1 = require("../../types/Documentation/Field");
const FieldType_1 = require("../../types/Documentation/FieldType");
const RelationshipType_1 = require("../../types/Documentation/RelationshipType");
class MongooseAdapter {
    constructor(models, inflector, idGenerator) {
        this.models = models || mongoose.models;
        this.inflector = inflector || pluralize;
        this.idGenerator = idGenerator;
    }
    find(type, idOrIds, fields, sorts, filters, includePaths, offset, limit) {
        const model = this.getModel(this.constructor.getModelName(type));
        const [mode, idQuery] = this.constructor.getIdQueryType(idOrIds);
        const pluralizer = this.inflector.plural;
        const isPaginating = typeof idOrIds !== 'string' &&
            (typeof offset !== 'undefined' || typeof limit !== 'undefined');
        const isFiltering = typeof filters === "object" && !Array.isArray(filters);
        let primaryDocumentsPromise, includedResourcesPromise = Q(null);
        const queryBuilder = mode === 'findOne'
            ? model[mode](idQuery)
            : model[mode](idQuery);
        const collectionSizePromise = isPaginating
            ? model.count(isFiltering ? filters : undefined).exec()
            : Promise.resolve(null);
        if (Array.isArray(sorts)) {
            queryBuilder.sort(sorts.join(" "));
        }
        if (isFiltering) {
            queryBuilder.where(filters);
        }
        if (offset) {
            queryBuilder.skip(offset);
        }
        if (limit) {
            queryBuilder.limit(limit);
        }
        if (includePaths) {
            const populatedPaths = [];
            const refPaths = util.getReferencePaths(model);
            includePaths = includePaths.map((it) => it.split("."));
            includePaths.forEach((pathParts) => {
                if (!arrays_1.arrayContains(refPaths, pathParts[0])) {
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
            const includedResources = [];
            primaryDocumentsPromise = Q(queryBuilder.exec()).then((docs) => {
                type_handling_1.forEachArrayOrVal(docs, (doc) => {
                    if (!doc)
                        return;
                    populatedPaths.forEach((path) => {
                        const refDocs = Array.isArray(doc[path]) ? doc[path] : [doc[path]];
                        refDocs.forEach((it) => {
                            if (it) {
                                includedResources.push(this.constructor.docToResource(it, pluralizer, fields));
                            }
                        });
                    });
                });
                return docs;
            });
            includedResourcesPromise = primaryDocumentsPromise.then(() => new Collection_1.default(includedResources));
        }
        else {
            primaryDocumentsPromise = Q(queryBuilder.exec());
        }
        return Q.all([primaryDocumentsPromise.then((it) => {
                const makeCollection = !idOrIds || Array.isArray(idOrIds) ? true : false;
                return this.constructor.docsToResourceOrCollection(it, makeCollection, pluralizer, fields);
            }), includedResourcesPromise, collectionSizePromise]).catch(util.errorHandler);
    }
    create(parentType, resourceOrCollection) {
        const resourcesByType = type_handling_1.groupResourcesByType(resourceOrCollection);
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
            const makeCollection = resourceOrCollection instanceof Collection_1.default;
            const finalDocs = docArrays.reduce((a, b) => a.concat(b), []);
            return this.constructor.docsToResourceOrCollection(finalDocs, makeCollection, this.inflector.plural);
        }).catch(util.errorHandler);
    }
    update(parentType, resourceOrCollection) {
        const model = this.getModel(this.constructor.getModelName(parentType));
        const singular = this.inflector.singular;
        const plural = this.inflector.plural;
        const resourceTypes = [];
        const changeSets = {};
        const idOrIds = type_handling_1.mapResources(resourceOrCollection, (it) => {
            changeSets[it.id] = it;
            resourceTypes.push(it.type);
            return it.id;
        });
        const [mode, idQuery] = this.constructor.getIdQueryType(idOrIds);
        const queryBuilder = mode === 'findOne'
            ? model[mode](idQuery)
            : model[mode](idQuery);
        return Q(queryBuilder.exec()).then((docs) => {
            const successfulSavesPromises = [];
            if (docs === null) {
                throw new APIError_1.default(404, undefined, "No matching resource found.");
            }
            else {
                const idOrIdsAsArray = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
                const docIdOrIdsAsArray = Array.isArray(docs) ? docs.map(it => it.id) : [docs.id];
                if (!arrays_1.arrayValuesMatch(idOrIdsAsArray, docIdOrIdsAsArray)) {
                    const title = "Some of the resources you're trying to update could not be found.";
                    throw new APIError_1.default(404, undefined, title);
                }
            }
            type_handling_1.forEachArrayOrVal(docs, (currDoc) => {
                const newResource = changeSets[currDoc.id];
                const currDocModel = currDoc.constructor;
                const currentModelName = currDocModel.modelName;
                const newModelName = this.constructor.getModelName(newResource.type, singular);
                if (currentModelName !== newModelName) {
                    const newDoc = currDoc.toObject({ virtuals: true, getters: true });
                    const NewModelConstructor = this.getModel(newModelName);
                    newDoc[currDocModel.schema.options.discriminatorKey] = newModelName;
                    currDoc = new NewModelConstructor(newDoc);
                    currDoc.isNew = false;
                }
                currDoc.set(util.resourceToDocObject(newResource));
                successfulSavesPromises.push(currDoc.save());
            });
            return Promise.all(successfulSavesPromises);
        }).then((docs) => {
            const makeCollection = resourceOrCollection instanceof Collection_1.default;
            return this.constructor.docsToResourceOrCollection(docs, makeCollection, plural);
        }).catch(util.errorHandler);
    }
    delete(parentType, idOrIds) {
        const model = this.getModel(this.constructor.getModelName(parentType));
        const [mode, idQuery] = this.constructor.getIdQueryType(idOrIds);
        if (!idOrIds) {
            return Q.Promise((resolve, reject) => {
                reject(new APIError_1.default(400, undefined, "You must specify some resources to delete"));
            });
        }
        const queryBuilder = mode === 'findOne'
            ? model[mode](idQuery)
            : model[mode](idQuery);
        return Q(queryBuilder.exec()).then((docs) => {
            if (!docs)
                throw new APIError_1.default(404, undefined, "No matching resource found.");
            type_handling_1.forEachArrayOrVal(docs, (it) => { it.remove(); });
            return docs;
        }).catch(util.errorHandler);
    }
    addToRelationship(type, id, relationshipPath, newLinkage) {
        const model = this.getModel(this.constructor.getModelName(type));
        const update = {
            $addToSet: {
                [relationshipPath]: { $each: newLinkage.value.map(it => it.id) }
            }
        };
        const options = { runValidators: true };
        return Q.ninvoke(model, "findOneAndUpdate", { "_id": id }, update, options)
            .catch(util.errorHandler);
    }
    removeFromRelationship(type, id, relationshipPath, linkageToRemove) {
        const model = this.getModel(this.constructor.getModelName(type));
        const update = {
            $pullAll: {
                [relationshipPath]: linkageToRemove.value.map(it => it.id)
            }
        };
        const options = { runValidators: true };
        return Q.ninvoke(model, "findOneAndUpdate", { "_id": id }, update, options)
            .catch(util.errorHandler);
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
    static docsToResourceOrCollection(docs, makeCollection, pluralizer, fields) {
        if (!docs || (!makeCollection && Array.isArray(docs) && docs.length === 0)) {
            throw new APIError_1.default(404, undefined, "No matching resource found.");
        }
        docs = !Array.isArray(docs) ? [docs] : docs;
        docs = docs.map((it) => this.docToResource(it, pluralizer, fields));
        return makeCollection ? new Collection_1.default(docs) : docs[0];
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
            if (fields && fields[type] && !arrays_1.arrayContains(fields[type], path)) {
                return;
            }
            const pathParts = path.split(".");
            let jsonValAtPath = pathParts.reduce(getProp, attrs);
            const referencedType = this.getReferencedType(doc.constructor, path);
            misc_1.deleteNested(path, attrs);
            let isToOneRelationship = false;
            if (!Array.isArray(jsonValAtPath)) {
                jsonValAtPath = [jsonValAtPath];
                isToOneRelationship = true;
            }
            let linkage = [];
            jsonValAtPath.forEach((docOrIdOrNull) => {
                let idOrNull;
                if (docOrIdOrNull && docOrIdOrNull._id) {
                    idOrNull = String(docOrIdOrNull._id);
                }
                else {
                    idOrNull = docOrIdOrNull ? String(docOrIdOrNull) : null;
                }
                linkage.push(idOrNull ? { type: referencedType, id: idOrNull } : null);
            });
            linkage = new Linkage_1.default(isToOneRelationship ? linkage[0] : linkage);
            relationships[path] = new Relationship_1.default(linkage);
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
        if (!model.discriminators)
            return [];
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
            if (arrays_1.arrayContains([versionKey, discriminatorKey], name)) {
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
    static getIdQueryType(idOrIds = undefined) {
        const [mode, idQuery, idsArray] = (() => {
            if (Array.isArray(idOrIds)) {
                return ["find", { _id: { "$in": idOrIds } }, idOrIds];
            }
            else if (typeof idOrIds === "string") {
                return ["findOne", { _id: idOrIds }, [idOrIds]];
            }
            else {
                return ["find", {}, undefined];
            }
        })();
        if (idsArray && !idsArray.every(this.idIsValid)) {
            throw Array.isArray(idOrIds)
                ? new APIError_1.default(400, undefined, "Invalid ID.")
                : new APIError_1.default(404, undefined, "No matching resource found.", "Invalid ID.");
        }
        return [mode, idQuery];
    }
    static idIsValid(id) {
        return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    }
}
exports.default = MongooseAdapter;
