import Q from "q"
import mongoose from "mongoose"
import {objectIsEmpty, arrayContains, deleteNested, mapArrayOrVal} from "../util/utils"
import pluralize from "pluralize"
import Resource from "../types/Resource"
import Collection from "../types/Collection"
import LinkObject from "../types/LinkObject"
import APIError from "../types/APIError"

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
    let pluralize = this.inflector.plural;
    let mode = "find", idQuery, primaryDocumentsPromise;

    if(idOrIds) {
      if(typeof idOrIds === "string") {
        mode = "findOne";
        idQuery = idOrIds;
      }
      else {
        idQuery = {"$in": idOrIds};
      }
    }

    // set up basic query for the collection or for the requested ids
    queryBuilder[mode](idQuery);

    // do sorting
    if(Array.isArray(sorts)) {
      queryBuilder.sort(sorts.join(" "));
    }

    // Prep the full fields object by creating mongoose `select` objects for
    // each type, rather than passing in the user's strings, so that the user
    // can't prefix a field with a minus on input to affect the query.
    // See http://mongoosejs.com/docs/api.html#query_Query-select.
    let arrToSelectObject = (prev, curr) => { prev[curr] = 1; return prev; };
    for(let type in fields) {
      fields[type] = fields[type].reduce(arrToSelectObject, {});
    }

    // now limit returned fields
    if(fields && fields.type) {
      queryBuilder.select(fields[type]);
    }

    return Q.all([Q(queryBuilder.exec()).then(
      (it) => this.constructor.docsToResourceOrCollection(it, pluralize)
    ), Q(null)]);
  }
    /*
    // Handle includes.
    if(includePaths) {
      includePaths = includePaths.map((it) => it.split("."));

      let includedDocumentsPromises = [];
      let pluralize = this.inflector.plural;

      // The basic strategy below is to reduce each pathParts array, which
      // represents a relationship, into an array of promises for resources
      // to included, which we can push() onto includedDocumentsPromises.
      for(let pathParts in includePaths) {

        let refPaths = this.constructor.getReferencePaths(model);

        // the relationship's path doesn't exist as a refPath on this model.
        if(arrayContains(refPaths, pathParts[0]) === false) {
          continue;
        }
      }

    }
    else {
      primaryDocumentsPromise = Q(queryBuilder.exec());
    } */
    // loop over the pathParts
      // loop over each pathParts' segments
        // for the current path segment
          // identify the containing model (i.e. that last queried or,
          // at first, the current model) and its type/refPaths.

          // if the containing model's type has a fields restriction, and that
          // fields restriction excludes the current path segment

    // run the query for the primary object(s).
    /*
    # handle includes
    if includePaths
      extraFieldsToRefTypes= {}
      duplicateQuery = queryBuilder.toConstructor!

      for pathParts in includePaths
        continue
        # We have two basic cases. First: including linked objects that are
        # direct properties of the resources we're returning. Handling these is
        # easy: we just populate the path (below), and then (later) the
        # @@docToResource code can turn it into a Resource object that's linked
        # to the Resource representing the primary document.
        if pathParts.length == 1
          refType = @@getType(@@getReferencedModelName(model, pathParts[0]), pluralize)

          # There's one special case we have to account for before populating,
          # though, which is: the current pathParts may start with a field
          # that's been excluded from the primary resources. E.g. a request for
          # /people?fields=name&include=address requires us to populate
          # person.address but then ultimately not include the address in the
          # generated Resource object. So, if that's the case:
          if (fields[type] and pathParts[0] not in fields[type])
            # We start by re-including the field in our query, enabling population.
            queryBuilder.select(pathParts[0])

            # Then we flag the field by adding it to extraFieldsToRefTypes.
            # This will let us remove it from the resource but still return it
            # as an external resource (i.e. a resource that's part of the
            # "linked" bag *even though* it's not directly connected to any of
            # the returned primary resources, because the field showing the
            # connection was excluded).
            extraFieldsToRefTypes[pathParts[0]] = refType

          # Finally, do the population
          populateArgs = {}
            ..\path = pathParts[0]
            ..\select = fields[type] if fields[type]
          queryBuilder.populate(populateArgs)

  var lastModelName = model.modelName;
  return extraDocumentsPromises.push(pathParts.reduce(function(resourcePromises, part){
    return resourcePromises.then(function(resources){
      var type, x$, populateArgs;
      if (resources) {
        lastModelName = constructor.getReferencedModelName(this$.getModel(lastModelName), part);
        type = constructor.getType(lastModelName, pluralize);
        x$ = populateArgs = {};
        x$['path'] = part;
        if (fields[type]) {
          x$['select'] = fields[type];
        }
        return Q.npost(this$.getModel(lastModelName), "populate", [resources, populateArgs]);
      }
    }).then(function(it){
      var flatten, mapped;
      if (!it || (it instanceof Array && !it.length)) {
        return it;
      }
      if (!(it instanceof Array)) {
        return it[part];
      } else {
        flatten = it[0][part] instanceof Array;
        mapped = it.map(function(it){
          return it[part];
        });
        if (flatten) {
          return mapped.reduce(function(a, b){
            return a.concat(b);
          });
        } else {
          return mapped;
        }
      }
    });
  }, Q(duplicateQuery().select(pathParts[0]).exec())).then(function(resources){
    if (!resources) {
      return {};
    }
    return {
      "type": type,
      "docSet": resources
    };
  })); /*
        # Then, we have another case of include paths in which the resources
        # included won't, in our final API response, be directly linked to any
        # of the primary Resources we're returning. This is when we have includes
        # that point to paths that aren't directly on this object (e.g. a post
        # including comments.author). We handle this (really inefficiently) below.
        else
          do ~>
            lastModelName = model.modelName
            extraDocumentsPromises.push(pathParts.reduce(
              (resourcePromises, part) ~>
                resourcePromises.then((resources) ~>
                  if resources
                    # update model
                    lastModelName := @@getReferencedModelName(@getModel(lastModelName), part)

                    # type
                    type = @@getType(lastModelName, pluralize)
                    populateArgs = {}
                      ..\path = part
                      ..\select = fields[type] if fields[type]

                    # populate this nested path
                    Q.npost(
                      @getModel(lastModelName),
                      "populate",
                      [resources, populateArgs]
                    );
                ).then(->
                  # if this population was empty, just stop
                  return it if !it or (it instanceof Array and !it.length)

                  # for the next population, we need to have a single doc or an array
                  # of docs. And we need to filter what we're getting in based on the
                  # currend path part (that's the reduce). So if the input (it) isn't
                  # an array (i.e it's a single doc), we just return it[part], which
                  # will, as needed, be a single doc (if it's a to-one relationship)
                  # or an array (if it's a to-many).
                  if it not instanceof Array
                    it[part]
                  # but, if `it` is an array, then it[part] could also be an array
                  # (from a to-many relationship), so just returning it.map(-> it[part])
                  # could leave a nested array, which is unacceptable for the next
                  # population. So, in that case, we also flatten (with reduce).
                  else
                    flatten = it[0][part] instanceof Array
                    mapped = it.map(-> it[part])
                    if flatten then mapped.reduce((a,b)-> a.concat(b)) else mapped
                )
              # below, .select(pathParts[0]) handles the case that the direct
              # property was excluded, similar to what we had to do above.
              , Q(duplicateQuery().select(pathParts[0]).exec!))
              .then((resources) ~>
                return {} if !resources
                # rather than just returning the populated resources at this
                # path, return an object with {"type", "resources"} keys where
                # type identifies the type of these resources from the schema,
                # which is more reliable than just reading the type of the first
                # resource--as that could be a sub-type of the refType.
                {"type": @@getType(lastModelName, pluralize), "docSet": resources}
              )
            );

      # use extraFieldsToRefTypes to put extra, populated fields into
      # extraResources (as resources) & remove them from the primary documents
      primaryDocumentsPromise = Q(queryBuilder.exec!)
        .then((docs) ~>
          utils.forEachArrayOrVal(docs, (doc) ->
            for field, refType of extraFieldsToRefTypes
              extraResources[refType] = [] if not extraResources[refType]

              # if it's a to-one relationship, doc[field] will be a doc or undefined;
              # if it's a toMany relationship, we have an array (or undefined). Either
              # way, we want to convert any docs in docs[field] to resources and store
              # them, so we always coerce it to an array.
              refDocs = if doc[field] instanceof Array then doc[field] else [doc[field]]
              refDocs.forEach(-> addDocAsExternalResource(it, refType))
              doc[field] = undefined
            void
          )
          docs
        )

      extraResourcesPromise = Q.all(extraDocumentsPromises)
        .then((docSets) ~>
          # add docs from these extra queries to extraResources
          for {type, docSet} in docSets
            extraResources[type] = [] if !extraResources[type]

            # Add the docs.
            docSet = [docSet] if docSet not instanceof Array
            docSet.forEach(-> addDocAsExternalResource(it, type))

          # and then, when the primaryDocuments promise has put its
          # resources into extraResources too, return them as promised
          primaryDocumentsPromise.then(-> extraResources)
        )

    else
      primaryDocumentsPromise = Q(queryBuilder.exec!)
      extraResourcesPromise = Q(undefined)

      # A little helper for the below
      addDocAsExternalResource = (doc) ~>
        # don't add empty references or duplicate docs.
        if doc
          extraResources.push(@@docToResource(doc, pluralize))

    # convert primary docs to resources/collections, which isn't needed for
    # extraResources--they're already resources and aren't supposed to be collections.
    primaryResourcesPromise = primaryDocumentsPromise.then(->
      @@docsToResourceOrCollection(it, pluralize)
    )

    Q.all([primaryResourcesPromise, extraResourcesPromise])
      .catch(-> [@@errorHandler(it), undefined])


    return Q([new Resource("people", "john"), [new Resource("dogs", "michael")]]);
  }
*/
  /**
   * Returns a Promise that fulfills with the created Resource. The Promise
   * may also reject with an error if creation failed or was unsupported.
   *
   * @param {string} parentType - All the resources to be created must be this
   *   type or be sub-types of it.
   * @param {(Resource|Collection)} resourceOrCollection - Ther resource or
   *   collection of resources to create.
   */
  create(parentType, resourceOrCollection) {
    let resourcesByType = {};
    let toCreateByType = {};
    let parentModel = this.getModel(this.constructor.getModelName(parentType));
    let allowedTypes = [parentType].concat(
      this.constructor.getChildTypes(parentModel, this.inflector.plural)
    );

    return Q.Promise((resolve, reject) => {
      if(resourceOrCollection instanceof Collection) {
        resourceOrCollection.resources.forEach((it) => {
          resourcesByType[it.type] = resourcesByType[it.type] || [];
          resourcesByType[it.type].push(it);
        });
      }
      else {
        resourcesByType[resourceOrCollection.type] = [resourceOrCollection];
      }

      // move resources w/ valid types from resourcesByType to toCreateByType
      // so we can throw an error if any invalid resources remain.
      allowedTypes.forEach((type) => {
        if(resourcesByType[type]) {
          toCreateByType[type] = resourcesByType[type];
          delete resourcesByType[type];
        }
      });

      if(Object.keys(resourcesByType).length !== 0) {
        let title = "Some of the resources you provided are of a type that " +
                    "doesn't belong in this collection.";
        let detail = `Valid types for this collection are: ${allowedTypes.join(', ')}.`;

        reject(new APIError(400, null, title, detail));
      }

      else {
        // Note: creating the resources as we do below means that we do one
        // query for each type, as opposed to only one query for all of the
        // documents. That's unfortunately much slower, but it ensures that
        // mongoose runs all the user's hooks.
        let creationPromises = [];
        for(let type in toCreateByType) {
          let model = this.getModel(this.constructor.getModelName(type));
          let resources = toCreateByType[type];
          let docObjects = resources.map(this.constructor.resourceToDocObject);

          if(typeof this.idGenerator === "function") {
            utils.forEachArrayOrVal(docObjects, (doc) => {
              doc._id = this.idGenerator(doc);
            });
          }

          creationPromises.push(
            Q.ninvoke(model, "create", docObjects).then((docs) => {
              // even though we gave it an array, if it was length == 1,
              // mongoose only gives us back a single doc. so handle that.
              return mapArrayOrVal(docs, (doc) => {
                this.constructor.docToResource(doc, this.inflector.plural)
              });
            })
          );
        }

        resolve(Q.all(creationPromises).then(
          (docArrays) => {
            let makeCollection = resourceOrCollection instanceof Collection;
            let finalDocs = docArrays.reduce((a, b) => a.concat(b), []);
            return makeCollection ? new Collection(finalDocs) : finalDocs[0];
          },
          this.constructor.errorHandler
        ));
      }
    });
  }

  getModel(modelName) {
    return this.models[modelName];
  }

  /**
   * Takes a Resource object and returns JSON that could be passed to Mongoose
   * to create a document for that resource. The returned JSON doesn't include
   * the id (as the input resources are coming from a client, and we're
   * ignoring client-provided ids) or the type (as that is set by mongoose
   * outside of the document) or the meta (as storing that like a field may not
   * be what we want to do).
   */
  static resourceToDocObject(resource) {
    let res = Object.assign({}, resource.attrs);
    for(let key in resource.links) {
      let linkage = resource.links[key].linkage;
      res[key] = Array.isArray(linkage) ? linkage.map(it => it.id) : linkage.id;
    }
    return res;
  }

  /**
   * @param docs The docs to turn into a resource or collection
   * @param type The type to use for the Collection, if one's being made.
   * @param pluralize An inflector function for setting the Resource's type
   */
  static docsToResourceOrCollection(docs, pluralize) {
    // if docs is an empty array, we don't 404, but we do for null.
    if(!docs) {
      return new APIError(404, null, "No matching resource found.");
    }

    let makeCollection = Array.isArray(docs);
    docs = !makeCollection ? [docs] : docs;
    docs = docs.map((it) => this.docToResource(it, pluralize));
    console.log(docs);
    return makeCollection ? new Collection(docs) : docs[0];
  }

  // Useful to have this as static for calling as a utility outside this class.
  static docToResource(doc, pluralize = pluralize.plural) {
    let type = this.getType(doc.constructor.modelName, pluralize);
    let refPaths = this.getReferencePaths(doc.constructor);

    // Get and clean up attributes
    let attrs = doc.toObject();
    let schemaOptions = doc.constructor.schema.options;
    delete attrs['_id'];
    delete attrs[schemaOptions.versionKey];
    delete attrs[schemaOptions.discriminatorKey];

    // Build Links
    let links = {};
    refPaths.forEach((path) => {
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

  static getModelName(type, singularize = pluralize.singular) {
    let words = type.split("-");
    words[words.length-1] = singularize(words[words.length-1]);
    return words.map((it) => it.charAt(0).toUpperCase() + it.slice(1)).join("");
  }

  // Get the json api type name for a model.
  static getType(modelName, pluralize = pluralize.plural) {
    return pluralize(modelName.replace(/([A-Z])/g, '\-$1').slice(1).toLowerCase());
  }

  static getReferencePaths(model) {
    let paths = [];
    model.schema.eachPath((name, type) => {
      if(this.isReferencePath(type)) paths.push(name);
    });
    return paths;
  }

  static isReferencePath(schemaType) {
    let options = (schemaType.caster || schemaType).options;
    return options && options.ref !== undefined;
  }

  static getReferencedModelName(model, path) {
    let schemaType = model.schema.path(path);
    let schemaOptions = (schemaType.caster || schemaType).options;
    return schemaOptions && schemaOptions.ref;
  }

  static getReferencedType(model, path) {
    return this.getType(this.getReferencedModelName(model, path), pluralize);
  }

  static getChildTypes(model, pluralize = pluralize.plural) {
    if(!model.discriminators) return [];

    return Object.keys(model.discriminators).map(it => this.getType(it, pluralize));
  }
}
/*

  find: (type, idOrIds, filters, fields, sorts, includePaths) ->

    # add where clauses
    queryBuilder.where(filters) if typeof! filters is "Object"



  # Create one or more docs.


  update: (type, idOrIds, changeSets) ->
    # It'd be faster to bypass Mongoose Document creation & just have mongoose
    # send a findAndUpdate command directly to mongo, but we want Mongoose's
    # standard validation and lifecycle hooks, and so we have to find first,
    # then update.
    model = @getModel(@@getModelName(type))
    switch typeof idOrIds
      | "string" =>
        idQuery = idOrIds
        mode = "findOne"
      | otherwise =>
        idQuery = {'$in':idOrIds}
        mode = "find"

    Q(model[mode]({'_id': idQuery}).exec!).then((docs) ~>
      successfulSavesPromises = [];

      utils.forEachArrayOrVal(docs, ->
        it.set(changeSets[it.id])
        successfulSavesPromises.push(
          Q.Promise((resolve, reject) ->
            it.save((err, doc) ->
              reject(err) if err
              resolve(doc)
            )
          )
        )
      );
      Q.all(successfulSavesPromises)
    ).then((docs) ~>
      @@docsToResourceOrCollection(docs, @inflector.plural)
    ).catch(@@errorHandler);

  delete: (type, idOrIds) ->
    model = @getModel(@@getModelName(type))

    # As with update, we're going to do the extra step of finding the docs,
    # loading them into Mongoose, and then removing them. Way slower than
    # removing from mongo directly, but it allows any .pre('remove') listeners
    # to execute.
    switch typeof idOrIds
      | "string" =>
        idQuery = idOrIds
        mode = "findOne"
      | otherwise =>
        idQuery = {'$in':idOrIds}
        mode = "find"

    Q(model[mode]({'_id': idQuery}).exec!).then((docs) ~>
      utils.forEachArrayOrVal(docs, -> it.remove!);
      docs
    ).catch(@@errorHandler);

  # Responsible for generating a sendable Error Resource if the query threw an Error
  @errorHandler = (err) ->
    # Convert a validation errors collection to something reasonable
    if err.errors?
      errors = [];
      for key, thisError of err.errors
        errors.push(
          new APIError(
            if err.name is "ValidationError" then 400 else (thisError.status || 500),
            null,
            thisError.message,
            null,
            null,
            if thisError.path? then [thisError.path] else null
          )
        )

      new Collection(errors, null, "errors")

    # allow the user to signal that their specific error message should be used.
    else if err.isJSONAPIDisplayReady
      new APIError(err.status || 500, null, err.message)

    # while still allowing us to issue something generic for most mongoose errors.
    else
      new APIError(
        400, null,
        "An error occurred while trying to find, create, or modify the requested resource(s)."
      );
*/
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
      refModel = @@getReferencedModelName(model, path)

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


  @getNestedSchemaPaths = (model) ->

module.exports = MongooseAdapter*/
