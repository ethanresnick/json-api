"use strict";

var _interopRequireWildcard = function (obj) { return obj && obj.__esModule ? obj : { "default": obj }; };

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Q = _interopRequire(require("q"));

var mongoose = _interopRequire(require("mongoose"));

var polyfill = _interopRequire(require("babel/polyfill"));

var arrayContains = require("../../util/arrays").arrayContains;

var deleteNested = require("../../util/misc").deleteNested;

var _utilTypeHandling = require("../../util/type-handling");

var forEachArrayOrVal = _utilTypeHandling.forEachArrayOrVal;
var objectIsEmpty = _utilTypeHandling.objectIsEmpty;
var mapArrayOrVal = _utilTypeHandling.mapArrayOrVal;
var mapResources = _utilTypeHandling.mapResources;

var util = _interopRequireWildcard(require("./lib"));

var pluralize = _interopRequire(require("pluralize"));

var Resource = _interopRequire(require("../../types/Resource"));

var Collection = _interopRequire(require("../../types/Collection"));

var Linkage = _interopRequire(require("../../types/Linkage"));

var LinkObject = _interopRequire(require("../../types/LinkObject"));

var APIError = _interopRequire(require("../../types/APIError"));

var nodeUtil = _interopRequire(require("util"));

var MongooseAdapter = (function () {
  function MongooseAdapter(models, inflector, idGenerator) {
    _classCallCheck(this, MongooseAdapter);

    this.models = models || mongoose.models;
    this.inflector = inflector || pluralize;
    this.idGenerator = idGenerator;
  }

  _createClass(MongooseAdapter, {
    find: {

      /**
       * Returns a Promise for an array of two items: the primary resources (either
       * a single Resource or a Collection) and the included resources, as an array.
       *
       * Note: The correct behavior if idOrIds is an empty array is to return no
       * documents, as happens below. If it's undefined, though, we're not filtering
       * by id and should return all documents.
       */

      value: function find(type, idOrIds, fields, sorts, filters, includePaths) {
        var _this = this;

        var model = this.getModel(this.constructor.getModelName(type));
        var queryBuilder = new mongoose.Query(null, null, model, model.collection);
        var pluralizer = this.inflector.plural;
        var mode = "find",
            idQuery = undefined;
        var primaryDocumentsPromise = undefined,
            includedResourcesPromise = Q(null);

        if (idOrIds) {
          if (typeof idOrIds === "string") {
            mode = "findOne";
            idQuery = idOrIds;
          } else {
            idQuery = { $in: idOrIds };
          }

          queryBuilder[mode]({ _id: idQuery });
        } else {
          queryBuilder.find();
        }

        // do sorting
        if (Array.isArray(sorts)) {
          sorts = sorts.map(function (it) {
            return it.startsWith("+") ? it.substr(1) : it;
          });
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
        if (includePaths) {
          (function () {
            var populatedPaths = [];
            var refPaths = util.getReferencePaths(model);

            includePaths = includePaths.map(function (it) {
              return it.split(".");
            });
            includePaths.forEach(function (pathParts) {
              // first, check that the include path is valid.
              if (!arrayContains(refPaths, pathParts[0])) {
                var title = "Invalid include path.";
                var detail = "Resources of type \"" + type + "\" don't have a(n) \"" + pathParts[0] + "\" relationship.";
                throw new APIError(400, undefined, title, detail);
              }

              if (pathParts.length > 1) {
                throw new APIError(501, undefined, "Multi-level include paths aren't yet supported.");
              }

              // Finally, do the population
              populatedPaths.push(pathParts[0]);
              queryBuilder.populate(pathParts[0]);
            });

            var includedResources = [];
            primaryDocumentsPromise = Q(queryBuilder.exec()).then(function (docs) {
              forEachArrayOrVal(docs, function (doc) {
                populatedPaths.forEach(function (path) {
                  // if it's a toOne relationship, doc[path] will be a doc or undefined;
                  // if it's a toMany relationship, we have an array (or undefined).
                  var refDocs = Array.isArray(doc[path]) ? doc[path] : [doc[path]];
                  refDocs.forEach(function (it) {
                    includedResources.push(_this.constructor.docToResource(it, pluralizer, fields));
                  });
                });
              });

              return docs;
            });

            includedResourcesPromise = primaryDocumentsPromise.then(function () {
              return includedResources;
            });
          })();
        } else {
          primaryDocumentsPromise = Q(queryBuilder.exec());
        }

        return Q.all([primaryDocumentsPromise.then(function (it) {
          var makeCollection = !idOrIds || Array.isArray(idOrIds) ? true : false;
          return _this.constructor.docsToResourceOrCollection(it, makeCollection, pluralizer, fields);
        }), includedResourcesPromise])["catch"](util.errorHandler);
      }
    },
    create: {

      /**
       * Returns a Promise that fulfills with the created Resource. The Promise
       * may also reject with an error if creation failed or was unsupported.
       *
       * @param {string} parentType - All the resources to be created must be this
       *   type or be sub-types of it.
       * @param {(Resource|Collection)} resourceOrCollection - The resource or
       *   collection of resources to create.
       */

      value: function create(parentType, resourceOrCollection) {
        var _this = this;

        var resourcesByType = util.groupResourcesByType(resourceOrCollection);
        var allowedTypes = this.getTypesAllowedInCollection(parentType);

        var resourceTypeError = util.getResourceTypeError(allowedTypes, Object.keys(resourcesByType));

        if (resourceTypeError) {
          return Q.Promise(function (resolve, reject) {
            reject(resourceTypeError);
          });
        }

        // Note: creating the resources as we do below means that we do one
        // query for each type, as opposed to only one query for all of the
        // documents. That's unfortunately much slower, but it ensures that
        // mongoose runs all the user's hooks.
        var creationPromises = [];
        var setIdWithGenerator = function (doc) {
          doc._id = _this.idGenerator(doc);
        };
        for (var type in resourcesByType) {
          var model = this.getModel(this.constructor.getModelName(type));
          var resources = resourcesByType[type];
          var docObjects = resources.map(util.resourceToDocObject);

          if (typeof this.idGenerator === "function") {
            forEachArrayOrVal(docObjects, setIdWithGenerator);
          }

          creationPromises.push(Q.ninvoke(model, "create", docObjects));
        }

        return Q.all(creationPromises).then(function (docArrays) {
          var makeCollection = resourceOrCollection instanceof Collection;
          var finalDocs = docArrays.reduce(function (a, b) {
            return a.concat(b);
          }, []);
          return _this.constructor.docsToResourceOrCollection(finalDocs, makeCollection, _this.inflector.plural);
        })["catch"](util.errorHandler);
      }
    },
    update: {

      /**
       * @param {string} parentType - All the resources to be created must be this
       *   type or be sub-types of it.
       * @param {Object} resourceOrCollection - The changed Resource or Collection
       *   of resources.
       */

      value: function update(parentType, resourceOrCollection) {
        var _this = this;

        // It'd be faster to bypass Mongoose Document creation & just have mongoose
        // send a findAndUpdate command directly to mongo, but we want Mongoose's
        // standard validation and lifecycle hooks, and so we have to find first.
        var model = this.getModel(this.constructor.getModelName(parentType));
        var singular = this.inflector.singular;
        var plural = this.inflector.plural;

        // Set up some data structures based on resourcesOrCollection
        var resourceTypes = [];
        var changeSets = {};
        var idOrIds = mapResources(resourceOrCollection, function (it) {
          changeSets[it.id] = it;
          resourceTypes.push(it.type);
          return it.id;
        });

        var mode = typeof idOrIds === "string" ? "findOne" : "find";
        var idQuery = typeof idOrIds === "string" ? idOrIds : { $in: idOrIds };

        // Validate that incoming resources are of the proper type.
        var allowedTypes = this.getTypesAllowedInCollection(parentType);
        var resourceTypeError = util.getResourceTypeError(allowedTypes, resourceTypes);

        if (resourceTypeError) {
          return Q.Promise(function (resolve, reject) {
            reject(resourceTypeError);
          });
        }

        return Q(model[mode]({ _id: idQuery }).exec()).then(function (docs) {
          var successfulSavesPromises = [];

          forEachArrayOrVal(docs, function (currDoc) {
            var newResource = changeSets[currDoc.id];

            // Allowing the type to change is a bit of a pain. If the type's
            // changed, it means the mongoose Model representing the doc must be
            // different too. So we have to get the data from the old doc with
            // .toObject(), change change its discriminator, and then create an
            // instance of the new model with that data. We also have to mark that
            // new instance as not representing a new document, so that mongoose
            // will do an update query rather than a save. Finally, we have to do
            // all this before updating other attributes, so that they're correctly
            // marked as modified when changed.
            var currentModelName = currDoc.constructor.modelName;
            var newModelName = _this.constructor.getModelName(newResource.type, singular);
            if (currentModelName !== newModelName) {
              var newDoc = currDoc.toObject();
              var newModel = _this.getModel(newModelName);
              newDoc[currDoc.constructor.schema.options.discriminatorKey] = newModelName;

              // replace the currDoc with our new creation.
              currDoc = new newModel(newDoc);
              currDoc.isNew = false;
            }

            // update all attributes and links provided, ignoring type/meta/id.
            currDoc.set(util.resourceToDocObject(newResource));

            successfulSavesPromises.push(Q.Promise(function (resolve, reject) {
              currDoc.save(function (err, doc) {
                if (err) reject(err);
                resolve(doc);
              });
            }));
          });

          return Q.all(successfulSavesPromises);
        }).then(function (docs) {
          var makeCollection = resourceOrCollection instanceof Collection;
          return _this.constructor.docsToResourceOrCollection(docs, makeCollection, plural);
        })["catch"](util.errorHandler);
      }
    },
    "delete": {
      value: function _delete(parentType, idOrIds) {
        var model = this.getModel(this.constructor.getModelName(parentType));
        var mode = "find",
            idQuery = undefined;

        if (!idOrIds) {
          return Q.Promise(function (resolve, reject) {
            reject(new APIError(400, undefined, "You must specify some resources to delete"));
          });
        } else if (typeof idOrIds === "string") {
          mode = "findOne";
          idQuery = idOrIds;
        } else {
          idQuery = { $in: idOrIds };
        }

        return Q(model[mode]({ _id: idQuery }).exec()).then(function (docs) {
          forEachArrayOrVal(docs, function (it) {
            it.remove();
          });
          return docs;
        })["catch"](util.errorHandler);
      }
    },
    getModel: {
      value: function getModel(modelName) {
        return this.models[modelName];
      }
    },
    getTypesAllowedInCollection: {
      value: function getTypesAllowedInCollection(parentType) {
        var parentModel = this.getModel(this.constructor.getModelName(parentType));
        return [parentType].concat(this.constructor.getChildTypes(parentModel, this.inflector.plural));
      }
    }
  }, {
    docsToResourceOrCollection: {

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

      value: function docsToResourceOrCollection(docs, makeCollection, pluralizer, fields) {
        var _this = this;

        // if docs is an empty array and we're making a collection, that's ok.
        // but, if we're looking for a single doc, we must 404 if we didn't find any.
        if (!docs || !makeCollection && Array.isArray(docs) && docs.length === 0) {
          return new APIError(404, undefined, "No matching resource found.");
        }

        docs = !Array.isArray(docs) ? [docs] : docs;
        docs = docs.map(function (it) {
          return _this.docToResource(it, pluralizer, fields);
        });
        return makeCollection ? new Collection(docs) : docs[0];
      }
    },
    docToResource: {

      // Useful to have this as static for calling as a utility outside this class.

      value: function docToResource(doc, _x, fields) {
        var _this = this;

        var pluralizer = arguments[1] === undefined ? pluralize.plural : arguments[1];

        var type = this.getType(doc.constructor.modelName, pluralizer);
        var refPaths = util.getReferencePaths(doc.constructor);

        // Get and clean up attributes
        // Loading with toJSON and depopulate means we don't have to handle
        // ObjectIds or worry about linked docs--we'll always get id Strings.
        var attrs = doc.toJSON({ depopulate: true });
        var schemaOptions = doc.constructor.schema.options;
        delete attrs._id;
        delete attrs[schemaOptions.versionKey];
        delete attrs[schemaOptions.discriminatorKey];

        // Delete attributes that aren't in the included fields.
        if (fields && fields[type]) {
          (function () {
            var newAttrs = {};
            fields[type].forEach(function (field) {
              if (attrs[field]) {
                newAttrs[field] = attrs[field];
              }
            });
            attrs = newAttrs;
          })();
        }

        // Build Links
        var links = {};
        var getProp = function (obj, part) {
          return obj[part];
        };

        refPaths.forEach(function (path) {
          // skip if applicable
          if (fields && fields[type] && !arrayContains(fields[type], path)) {
            return;
          }

          // get value at the path w/ the reference, in both the json'd + full docs.
          var pathParts = path.split(".");
          var jsonValAtPath = pathParts.reduce(getProp, attrs);
          var referencedType = _this.getReferencedType(doc.constructor, path);

          // delete the attribute, since we're moving it to links
          deleteNested(path, attrs);

          // Now, since the value wasn't excluded, we need to build its LinkObject.
          // Note: the value could still be null or an empty array. And, because of
          // of population, it could be a single document or array of documents,
          // in addition to a single/array of ids. So, as is customary, we'll start
          // by coercing it to an array no matter what, tracking whether to make it
          // a non-array at the end, to simplify our code.
          var isToOneRelationship = false;

          if (!Array.isArray(jsonValAtPath)) {
            jsonValAtPath = [jsonValAtPath];
            isToOneRelationship = true;
          }

          var linkage = [];
          jsonValAtPath.forEach(function (idOrNull) {
            // Even though we did toJSON(), id may be an ObjectId. (lame.)
            idOrNull = idOrNull ? String(idOrNull).toString() : idOrNull;

            linkage.push(idOrNull ? { type: referencedType, id: idOrNull } : null);
          });

          // go back from an array if neccessary and save.
          linkage = new Linkage(isToOneRelationship ? linkage[0] : linkage);
          links[path] = new LinkObject(linkage);
        });

        // finally, create the resource.
        return new Resource(type, doc.id, attrs, links);
      }
    },
    getModelName: {
      value: function getModelName(type) {
        var singularizer = arguments[1] === undefined ? pluralize.singular : arguments[1];

        var words = type.split("-");
        words[words.length - 1] = singularizer(words[words.length - 1]);
        return words.map(function (it) {
          return it.charAt(0).toUpperCase() + it.slice(1);
        }).join("");
      }
    },
    getType: {

      // Get the json api type name for a model.

      value: function getType(modelName) {
        var pluralizer = arguments[1] === undefined ? pluralize.plural : arguments[1];

        return pluralizer(modelName.replace(/([A-Z])/g, "-$1").slice(1).toLowerCase());
      }
    },
    getReferencedType: {
      value: function getReferencedType(model, path) {
        var pluralizer = arguments[2] === undefined ? pluralize.plural : arguments[2];

        return this.getType(util.getReferencedModelName(model, path), pluralizer);
      }
    },
    getChildTypes: {
      value: function getChildTypes(model) {
        var _this = this;

        var pluralizer = arguments[1] === undefined ? pluralize.plural : arguments[1];

        if (!model.discriminators) {
          return [];
        }return Object.keys(model.discriminators).map(function (it) {
          return _this.getType(it, pluralizer);
        });
      }
    },
    getStandardizedSchema: {
      value: function getStandardizedSchema(model) {
        var schemaOptions = model.schema.options;
        var versionKey = schemaOptions.versionKey;
        var discriminatorKey = schemaOptions.discriminatorKey;
        var standardSchema = {};

        // valid types are String, Array[String], Number, Array[Number], Boolean,
        // Array[Boolean], Date, Array[Date], Id (for a local id), ModelNameId and
        // Array[ModelNameId].
        var getStandardTypeString = function (path, schemaType) {
          if (path === "_id") {
            return "Id";
          }

          var typeOptions = schemaType.options.type;
          var holdsArray = Array.isArray(typeOptions);
          var baseType = holdsArray ? typeOptions[0].type.name : typeOptions.name;
          var refModelName = util.getReferencedModelName(model, path);

          var res = holdsArray ? "Array[" : "";
          res += refModelName ? refModelName + "Id" : baseType;
          res += holdsArray ? "]" : "";

          return res;
        };

        model.schema.eachPath(function (name, type) {
          if (arrayContains([versionKey, discriminatorKey], name)) {
            return;
          }

          var standardTypeString = getStandardTypeString(name, type);
          name = name === "_id" ? "id" : name;
          var likelyAutoGenerated = standardTypeString === "Date" && /created|updated|modified/.test(name) && typeof type.options["default"] === "function";

          var defaultVal = undefined;
          if (name === "_id" || likelyAutoGenerated) {
            defaultVal = "(auto generated)";
          } else if (type.options["default"] && typeof type.options["default"] !== "function") {
            defaultVal = type.options["default"];
          }

          standardSchema[name] = {
            type: standardTypeString,
            "default": defaultVal,
            enumValues: type.options["enum"] ? type.enumValues : undefined,
            required: type.options.required
          };
        });

        return standardSchema;
      }
    }
  });

  return MongooseAdapter;
})();

module.exports = MongooseAdapter;