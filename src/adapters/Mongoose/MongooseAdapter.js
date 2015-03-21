import Q from "q"
import mongoose from "mongoose"
import polyfill from "babel/polyfill"
import {arrayContains} from "../../util/arrays"
import {deleteNested} from "../../util/misc"
import {forEachArrayOrVal, objectIsEmpty, mapArrayOrVal, mapResources} from "../../util/type-handling"
import * as util from "./lib"
import pluralize from "pluralize"
import Resource from "../../types/Resource"
import Collection from "../../types/Collection"
import LinkObject from "../../types/LinkObject"
import APIError from "../../types/APIError"
import nodeUtil from "util";

export default class MongooseAdapter {
  constructor(models, inflector, idGenerator) {
    this.models = models || mongoose.models;
    this.inflector = inflector || pluralize;
    this.idGenerator = idGenerator;
  }

  /**
   * Returns a Promise for an array of two items: the primary resources (either
   * a single Resource or a Collection) and the included resources, as an array.
   *
   * Note: The correct behavior if idOrIds is an empty array is to return no
   * documents, as happens below. If it's undefined, though, we're not filtering
   * by id and should return all documents.
   */
  find(type, idOrIds, fields, sorts, filters, includePaths) {
    let model = this.getModel(this.constructor.getModelName(type));
    let queryBuilder = new mongoose.Query(null, null, model, model.collection);
    let pluralizer = this.inflector.plural;
    let mode = "find", idQuery, makeCollection;
    let primaryDocumentsPromise, includedResourcesPromise = Q(null);

    if(idOrIds) {
      if(typeof idOrIds === "string") {
        mode = "findOne";
        idQuery = idOrIds;
      }
      else {
        idQuery = {"$in": idOrIds};
      }

      queryBuilder[mode]({'_id': idQuery});
    }

    else {
      queryBuilder.find();
    }

    // do sorting
    if(Array.isArray(sorts)) {
      sorts = sorts.map((it) => it.startsWith('+') ? it.substr(1) : it);
      queryBuilder.sort(sorts.join(" "));
    }

    // in an ideal world, we'd use mongoose to filter the fields before
    // querying. But, because the fields to filter can be scoped by type and
    // we don't always know about a document's type until post query (becuase of
    // discriminator keys), and because filtering out fields can really
    // complicate population for includes, we don't filter at query time and
    // instead just hide fields filtered by type in @docToResource.

    // support includes, but only a level deep for now (recursive includes,
    // especially if done in an efficient way query wise, are a pain in the ass).
    if(includePaths) {
      const populatedPaths = [];
      const refPaths = util.getReferencePaths(model);

      includePaths = includePaths.map((it) => it.split('.'));
      includePaths.forEach((pathParts) => {
        // first, check that the include path is valid.
        if(!arrayContains(refPaths, pathParts[0])) {
          let title = "Invalid include path.";
          let detail = `Resources of type "${type}" don't have a(n) "${pathParts[0]}" relationship.`;
          throw new APIError(400, undefined, title, detail);
        }

        if(pathParts.length > 1) {
          throw new APIError(501, undefined, "Multi-level include paths aren't yet supported.");
        }

        // Finally, do the population
        populatedPaths.push(pathParts[0]);
        queryBuilder.populate(pathParts[0]);
      });

      let includedResources = [];
      primaryDocumentsPromise = Q(queryBuilder.exec()).then((docs) => {
        console.log(nodeUtil.inspect(docs));
        forEachArrayOrVal(docs, (doc) => {
          console.log(mongoose.Document);
         populatedPaths.forEach((path) => {
            // if it's a toOne relationship, doc[path] will be a doc or undefined;
            // if it's a toMany relationship, we have an array (or undefined).
            let refDocs = Array.isArray(doc[path]) ? doc[path] : [doc[path]];
            refDocs.forEach((it) => {
              includedResources.push(
                this.constructor.docToResource(it, pluralizer, fields)
              );
            });
          });
        });

        return docs;
      });

      includedResourcesPromise = primaryDocumentsPromise.then(() =>
        includedResources
      );
    }

    else {
      primaryDocumentsPromise = Q(queryBuilder.exec());
    }

    return Q.all([primaryDocumentsPromise.then((it) => {
        const makeCollection = !idOrIds || Array.isArray(idOrIds) ? true : false;
        return this.constructor.docsToResourceOrCollection(it, makeCollection, pluralizer, fields);
      }), includedResourcesPromise], this.constructor.errorHandler);
  }

  /**
   * Returns a Promise that fulfills with the created Resource. The Promise
   * may also reject with an error if creation failed or was unsupported.
   *
   * @param {string} parentType - All the resources to be created must be this
   *   type or be sub-types of it.
   * @param {(Resource|Collection)} resourceOrCollection - The resource or
   *   collection of resources to create.
   */
  create(parentType, resourceOrCollection) {
    const resourcesByType = util.groupResourcesByType(resourceOrCollection);
    const allowedTypes = this.getTypesAllowedInCollection(parentType);

    const resourceTypeError = util.getResourceTypeError(
      allowedTypes, Object.keys(resourcesByType)
    );

    if(resourceTypeError) {
      return Q.Promise((resolve, reject) => { reject(resourceTypeError); });
    }

    // Note: creating the resources as we do below means that we do one
    // query for each type, as opposed to only one query for all of the
    // documents. That's unfortunately much slower, but it ensures that
    // mongoose runs all the user's hooks.
    let creationPromises = [];
    for(let type in resourcesByType) {
      let model = this.getModel(this.constructor.getModelName(type));
      let resources = resourcesByType[type];
      let docObjects = resources.map(util.resourceToDocObject);

      if(typeof this.idGenerator === "function") {
        forEachArrayOrVal(docObjects, (doc) => {
          doc._id = this.idGenerator(doc);
        });
      }

      creationPromises.push(Q.ninvoke(model, "create", docObjects));
    }

    return Q.all(creationPromises).then(
      (docArrays) => {
        const makeCollection = resourceOrCollection instanceof Collection;
        const finalDocs = docArrays.reduce((a, b) => a.concat(b), []);
        return this.constructor.docsToResourceOrCollection(finalDocs, makeCollection, this.inflector.plural);
      },
      this.constructor.errorHandler
    );
  }

  /**
   * @param {string} parentType - All the resources to be created must be this
   *   type or be sub-types of it.
   * @param {Object} resourceOrCollection - The changed Resource or Collection
   *   of resources.
   */
  update(parentType, resourceOrCollection) {
    // It'd be faster to bypass Mongoose Document creation & just have mongoose
    // send a findAndUpdate command directly to mongo, but we want Mongoose's
    // standard validation and lifecycle hooks, and so we have to find first.
    const model   = this.getModel(this.constructor.getModelName(parentType));
    const singular = this.inflector.singular;
    const plural = this.inflector.plural;

    // Set up some data structures based on resourcesOrCollection
    const resourceTypes = [];
    const changeSets = {};
    const idOrIds = mapResources(resourceOrCollection, (it) => {
      changeSets[it.id] = it;
      resourceTypes.push(it.type);
      return it.id;
    });

    const mode    = typeof idOrIds === "string" ? "findOne" : "find";
    const idQuery = typeof idOrIds === "string" ? idOrIds : {'$in':idOrIds};

    // Validate that incoming resources are of the proper type.
    const allowedTypes = this.getTypesAllowedInCollection(parentType);
    const resourceTypeError = util.getResourceTypeError(allowedTypes, resourceTypes);

    if(resourceTypeError) {
      return Q.Promise((resolve, reject) => { reject(resourceTypeError); });
    }

    return Q(model[mode]({'_id': idQuery}).exec()).then((docs) => {
      const successfulSavesPromises = [];

      forEachArrayOrVal(docs, (currDoc) => {
        let newResource = changeSets[currDoc.id];

        // Allowing the type to change is a bit of a pain. If the type's
        // changed, it means the mongoose Model representing the doc must be
        // different too. So we have to get the data from the old doc with
        // .toObject(), change change its discriminator, and then create an
        // instance of the new model with that data. We also have to mark that
        // new instance as not representing a new document, so that mongoose
        // will do an update query rather than a save. Finally, we have to do
        // all this before updating other attributes, so that they're correctly
        // marked as modified when changed.
        const currentModelName = currDoc.constructor.modelName;
        const newModelName = this.constructor.getModelName(newResource.type, singular);
        if(currentModelName !== newModelName) {
          const newDoc = currDoc.toObject();
          const newModel = this.getModel(newModelName);
          newDoc[currDoc.constructor.schema.options.discriminatorKey] = newModelName;

          // replace the currDoc with our new creation.
          currDoc = new newModel(newDoc);
          currDoc.isNew = false;
        }

        // update all attributes and links provided, ignoring type/meta/id.
        currDoc.set(util.resourceToDocObject(newResource));

        successfulSavesPromises.push(
          Q.Promise(function (resolve, reject) {
            currDoc.save((err, doc) => {
              if(err) reject(err);
              resolve(doc);
            });
          })
        );
      });

      return Q.all(successfulSavesPromises);
    }).then((docs) => {
      let makeCollection = resourceOrCollection instanceof Collection;
      return this.constructor.docsToResourceOrCollection(docs, makeCollection, plural);
    }).catch(this.constructor.errorHandler);
  }

  delete(parentType, idOrIds) {
    const model = this.getModel(this.constructor.getModelName(parentType));
    let mode = "find", idQuery;

    if(!idOrIds) {
      return Q.Promise((resolve, reject) => {
        reject(new APIError(400, undefined, "You must specify some resources to delete"));
      });
    }

    else if(typeof idOrIds === "string") {
      mode = "findOne";
      idQuery = idOrIds;
    }
    else {
      idQuery = {"$in": idOrIds};
    }

    return Q(model[mode]({'_id': idQuery}).exec()).then((docs) => {
      forEachArrayOrVal(docs, (it) => { it.remove() });
      return docs;
    }).catch(this.constructor.errorHandler);
  }

  getModel(modelName) {
    return this.models[modelName];
  }

  getTypesAllowedInCollection(parentType) {
    const parentModel = this.getModel(this.constructor.getModelName(parentType));
    return [parentType].concat(
      this.constructor.getChildTypes(parentModel, this.inflector.plural)
    );
  }

  /**
   * Takes any error that resulted from the above operations throws an array of
   * errors that can be sent back to the caller as the Promise's rejection value.
   */
  static errorHandler(err) {
    const errors = [];
    console.log(err, err.stack);
    //Convert validation errors collection to something reasonable
    if(err.errors) {
      for(let errKey in err.errors) {
        let thisError = err.errors[errKey];
        errors.push(
          new APIError(
            (err.name === "ValidationError") ? 400 : (thisError.status || 500),
            undefined,
            thisError.message,
            undefined,
            undefined,
            (thisError.path) ? [thisError.path] : undefined
          )
        );
      }
    }

    // allow the user to signal (e.g. from a custom validator that the
    // mongoose hooks run) that their specific error message should be used.
    else if(err.isJSONAPIDisplayReady) {
      errors.push(new APIError(err.status || 500, undefined, err.message));
    }

    // Otherwise, issue something generic to not reveal any internal db concerns.
    else {
      errors.push(new APIError(400, undefined,
        "An error occurred while trying to find, create, or modify the requested resource(s)."
      ));
    }

    throw errors;
  }

  /**
   * We want to always return a collection when the user is asking for something
   * that's logically a Collection (even if it only has 1 item), and a Resource
   * otherwise. But, because mongoose returns a single doc if you query for a
   * one-item array of ids, and because we sometimes generate arrays (e.g. of
   * promises for documents' successful creation) even when only creating/updating
   * one document, just looking at whether docs is an array isn't enough to tell
   * us whether to return a collection or not. And, in all these cases, we want
   * to handle the possibility that the query returned no documents when we needed
   * one, such that we must 404. This function centralizes all that logic.
   *
   * @param docs The docs to turn into a resource or collection
   * @param makeCollection Whether we're making a collection.
   * @param pluralizer An inflector function for setting the Resource's type
   */
  static docsToResourceOrCollection(docs, makeCollection, pluralizer, fields) {
    // if docs is an empty array and we're making a collection, that's ok.
    // but, if we're looking for a single doc, we must 404 if we didn't find any.
    if(!docs || (!makeCollection && Array.isArray(docs) && docs.length === 0)) {
      return new APIError(404, undefined, "No matching resource found.");
    }

    docs = !Array.isArray(docs) ? [docs] : docs;
    docs = docs.map((it) => this.docToResource(it, pluralizer, fields));
    return makeCollection ? new Collection(docs) : docs[0];
  }

  // Useful to have this as static for calling as a utility outside this class.
  static docToResource(doc, pluralizer = pluralize.plural, fields) {
    let type = this.getType(doc.constructor.modelName, pluralizer);
    let refPaths = util.getReferencePaths(doc.constructor);

    // Get and clean up attributes
    let attrs = doc.toObject();
    let schemaOptions = doc.constructor.schema.options;
    delete attrs['_id'];
    delete attrs[schemaOptions.versionKey];
    delete attrs[schemaOptions.discriminatorKey];

    // Delete attributes that aren't in the included fields.
    if(fields && fields[type]) {
      let newAttrs = {};
      fields[type].forEach((field) => {
        if(attrs[field]) {
          newAttrs[field] = attrs[field];
        }
      });
      attrs = newAttrs;
    }

    // Build Links
    let links = {};
    refPaths.forEach((path) => {
      // skip if applicable
      if(fields && fields[type] && !arrayContains(fields[type], path)) {
        return;
      }

      // get value at the path w/ the reference, in both the json'd + full docs.
      let getNested = (obj, part) => obj[part];
      let pathParts = path.split('.');
      let valAtPath = pathParts.reduce(getNested, doc);
      let jsonValAtPath = pathParts.reduce(getNested, attrs);
      let referencedType = this.getReferencedType(doc.constructor, path);

      // delete the attribute, since we're moving it to links
      deleteNested(path, attrs);

      // in the rare case that this is a refPath whose field has been excluded
      // from the document, make sure we don't add a links key for it.
      if(typeof valAtPath === "undefined") { return }

      // Now, since the value wasn't excluded, we need to build its LinkObject.
      // Note: the value could still be null or an empty array. And, because of
      // of population, it could be a single document or array of documents,
      // in addition to a single/array of ids. So, as is customary, we'll start
      // by coercing it to an array no matter what, tracking whether to make it
      // a non-array at the end, to simplify our code.
      let isToOneRelationship = false;

      if(!Array.isArray(valAtPath)) {
        valAtPath = [valAtPath];
        jsonValAtPath = [jsonValAtPath];
        isToOneRelationship = true;
      }

      let linkage = [];
      valAtPath.forEach((docOrIdOrNull, i) => {
        if(docOrIdOrNull instanceof mongoose.Document) {
          linkage.push({type: referencedType, id: docOrIdOrNull.id});
        }
        else if(docOrIdOrNull) {
          // docOrIdOrNull might be an OId here, so use jsonValAtPath,
          // which will have been converted to a string.
          linkage.push({type: referencedType, id: jsonValAtPath[i]});
        }
        else {
          linkage.push(docOrIdOrNull);
        }
      });

      // go back from an array if neccessary and save.
      links[path] = new LinkObject(isToOneRelationship ? linkage[0] : linkage);
    });

    // finally, create the resource.
    return new Resource(type, doc.id, attrs, links);
  }

  static getModelName(type, singularizer = pluralize.singular) {
    let words = type.split("-");
    words[words.length-1] = singularizer(words[words.length-1]);
    return words.map((it) => it.charAt(0).toUpperCase() + it.slice(1)).join("");
  }

  // Get the json api type name for a model.
  static getType(modelName, pluralizer = pluralize.plural) {
    return pluralizer(modelName.replace(/([A-Z])/g, '\-$1').slice(1).toLowerCase());
  }

  static getReferencedType(model, path, pluralizer = pluralize.plural) {
    return this.getType(util.getReferencedModelName(model, path), pluralizer);
  }

  static getChildTypes(model, pluralizer = pluralize.plural) {
    if(!model.discriminators) return [];

    return Object.keys(model.discriminators).map(it => this.getType(it, pluralizer));
  }
}

/*


  @getStandardizedSchema = (model) ->
    schema = model.schema
    schemaOptions = model.schema.options
    standardSchema = {}

    # valid types are String, Array[String], Number, Array[Number], Boolean, Array[Boolean],
    # Date, Array[Date], Id (for a local id), ModelNameId and Array[ModelNameId].
    _getStandardType = (path, schemaType) ->
      return 'Id' if path is '_id'

      isArray = schemaType.options.type instanceof Array
      rawType = if isArray then schemaType.options.type.0.type.name else schemaType.options.type.name
      refModel = util.getReferencedModelName(model, path)

      res = if isArray then 'Array[' else ''
      res += if refModel then (refModel + 'Id') else rawType
      res += if isArray then ']' else ''
      res

    model.schema.eachPath((name, type) ~>
      return if name in [schemaOptions.versionKey, schemaOptions.discriminatorKey]

      standardType = _getStandardType(name, type)
      name = 'id' if name is '_id'
      required = type.options.required
      enumValues = type.options.enum?.values
      defaultVal =
        if name is 'id' or (standardType is 'Date' && name in ['created', 'modified'] && typeof type.options.default=='function')
        then '(auto generated)'
        else (type.options.default if (type.options.default? and typeof type.options.default != 'function'))

      standardSchema[name] =
        type: standardType
        default: defaultVal
        enumValues: enumValues
        required: required
    )
    standardSchema


  @getNestedSchemaPaths = (model) -> */
