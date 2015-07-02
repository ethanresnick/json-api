"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _defineProperty = require("babel-runtime/helpers/define-property")["default"];

var _Object$keys = require("babel-runtime/core-js/object/keys")["default"];

var _Object$assign = require("babel-runtime/core-js/object/assign")["default"];

var _interopRequireDefault = require("babel-runtime/helpers/interop-require-default")["default"];

var _interopRequireWildcard = require("babel-runtime/helpers/interop-require-wildcard")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _q = require("q");

var _q2 = _interopRequireDefault(_q);

var _mongoose = require("mongoose");

var _mongoose2 = _interopRequireDefault(_mongoose);

var _utilArrays = require("../../util/arrays");

var _utilMisc = require("../../util/misc");

var _utilTypeHandling = require("../../util/type-handling");

var _lib = require("./lib");

var util = _interopRequireWildcard(_lib);

var _pluralize = require("pluralize");

var _pluralize2 = _interopRequireDefault(_pluralize);

var _typesResource = require("../../types/Resource");

var _typesResource2 = _interopRequireDefault(_typesResource);

var _typesCollection = require("../../types/Collection");

var _typesCollection2 = _interopRequireDefault(_typesCollection);

var _typesLinkage = require("../../types/Linkage");

var _typesLinkage2 = _interopRequireDefault(_typesLinkage);

var _typesRelationshipObject = require("../../types/RelationshipObject");

var _typesRelationshipObject2 = _interopRequireDefault(_typesRelationshipObject);

var _typesAPIError = require("../../types/APIError");

var _typesAPIError2 = _interopRequireDefault(_typesAPIError);

var _typesDocumentationField = require("../../types/Documentation/Field");

var _typesDocumentationField2 = _interopRequireDefault(_typesDocumentationField);

var _typesDocumentationFieldType = require("../../types/Documentation/FieldType");

var _typesDocumentationFieldType2 = _interopRequireDefault(_typesDocumentationFieldType);

var _typesDocumentationRelationshipType = require("../../types/Documentation/RelationshipType");

var _typesDocumentationRelationshipType2 = _interopRequireDefault(_typesDocumentationRelationshipType);

var MongooseAdapter = (function () {
  function MongooseAdapter(models, inflector, idGenerator) {
    _classCallCheck(this, MongooseAdapter);

    this.models = models || _mongoose2["default"].models;
    this.inflector = inflector || _pluralize2["default"];
    this.idGenerator = idGenerator;
  }

  _createClass(MongooseAdapter, [{
    key: "find",

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
      var queryBuilder = new _mongoose2["default"].Query(null, null, model, model.collection);
      var pluralizer = this.inflector.plural;
      var mode = "find",
          idQuery = undefined;
      var primaryDocumentsPromise = undefined,
          includedResourcesPromise = (0, _q2["default"])(null);

      if (idOrIds) {
        if (typeof idOrIds === "string") {
          mode = "findOne";
          idQuery = idOrIds;
        } else {
          idQuery = { "$in": idOrIds };
        }

        queryBuilder[mode]({ "_id": idQuery });
      } else {
        queryBuilder.find();
      }

      // do sorting
      if (Array.isArray(sorts)) {
        queryBuilder.sort(sorts.join(" "));
      }

      // filter out invalid records with simple fields equality.
      // note that there's a non-trivial risk of sql-like injection here.
      // we're mostly protected by the fact that we're treating the filter's
      // value as a single string, though, and not parsing as JSON.
      if (typeof filters === "object" && !Array.isArray(filters)) {
        queryBuilder.where(filters);
      }

      // in an ideal world, we'd use mongoose here to filter the fields before
      // querying. But, because the fields to filter can be scoped by type and
      // we don't always know about a document's type until after query (becuase
      // of discriminator keys), and because filtering out fields can really
      // complicate population for includes, we don't yet filter at query time but
      // instead just hide filtered fields in @docToResource. There is a more-
      // efficient way to do this down the road, though--something like taking the
      // provided fields and expanding them just enough (by looking at the type
      // heirarachy and the relationship paths) to make sure that we're not going
      // to run into any of the problems outlined above, while still querying for
      // less data than we would without any fields restriction. For reference, the
      // code for safely using the user's `fields` input, by putting them into a
      // mongoose `.select()` object so that the user can't prefix a field with a
      // minus on input to affect the query, is below.
      // Reference: http://mongoosejs.com/docs/api.html#query_Query-select.
      // let arrToSelectObject = (prev, curr) => { prev[curr] = 1; return prev; };
      // for(let type in fields) {
      //   fields[type] = fields[type].reduce(arrToSelectObject, {});
      // }

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
            if (!(0, _utilArrays.arrayContains)(refPaths, pathParts[0])) {
              var title = "Invalid include path.";
              var detail = "Resources of type \"" + type + "\" don't have a(n) \"" + pathParts[0] + "\" relationship.";
              throw new _typesAPIError2["default"](400, undefined, title, detail);
            }

            if (pathParts.length > 1) {
              throw new _typesAPIError2["default"](501, undefined, "Multi-level include paths aren't yet supported.");
            }

            // Finally, do the population
            populatedPaths.push(pathParts[0]);
            queryBuilder.populate(pathParts[0]);
          });

          var includedResources = [];
          primaryDocumentsPromise = (0, _q2["default"])(queryBuilder.exec()).then(function (docs) {
            (0, _utilTypeHandling.forEachArrayOrVal)(docs, function (doc) {
              populatedPaths.forEach(function (path) {
                // if it's a toOne relationship, doc[path] will be a doc or undefined;
                // if it's a toMany relationship, we have an array (or undefined).
                var refDocs = Array.isArray(doc[path]) ? doc[path] : [doc[path]];
                refDocs.forEach(function (it) {
                  // only include if it's not undefined.
                  if (it) {
                    includedResources.push(_this.constructor.docToResource(it, pluralizer, fields));
                  }
                });
              });
            });

            return docs;
          });

          includedResourcesPromise = primaryDocumentsPromise.then(function () {
            return new _typesCollection2["default"](includedResources);
          });
        })();
      } else {
        primaryDocumentsPromise = (0, _q2["default"])(queryBuilder.exec());
      }

      return _q2["default"].all([primaryDocumentsPromise.then(function (it) {
        var makeCollection = !idOrIds || Array.isArray(idOrIds) ? true : false;
        return _this.constructor.docsToResourceOrCollection(it, makeCollection, pluralizer, fields);
      }), includedResourcesPromise])["catch"](util.errorHandler);
    }
  }, {
    key: "create",

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
      var _this2 = this;

      var resourcesByType = (0, _utilTypeHandling.groupResourcesByType)(resourceOrCollection);

      // Note: creating the resources as we do below means that we do one
      // query for each type, as opposed to only one query for all of the
      // documents. That's unfortunately much slower, but it ensures that
      // mongoose runs all the user's hooks.
      var creationPromises = [];
      var setIdWithGenerator = function setIdWithGenerator(doc) {
        doc._id = _this2.idGenerator(doc);
      };
      for (var type in resourcesByType) {
        var model = this.getModel(this.constructor.getModelName(type));
        var resources = resourcesByType[type];
        var docObjects = resources.map(util.resourceToDocObject);

        if (typeof this.idGenerator === "function") {
          (0, _utilTypeHandling.forEachArrayOrVal)(docObjects, setIdWithGenerator);
        }

        creationPromises.push(_q2["default"].ninvoke(model, "create", docObjects));
      }

      return _q2["default"].all(creationPromises).then(function (docArrays) {
        var makeCollection = resourceOrCollection instanceof _typesCollection2["default"];
        var finalDocs = docArrays.reduce(function (a, b) {
          return a.concat(b);
        }, []);
        return _this2.constructor.docsToResourceOrCollection(finalDocs, makeCollection, _this2.inflector.plural);
      })["catch"](util.errorHandler);
    }
  }, {
    key: "update",

    /**
     * @param {string} parentType - All the resources to be created must be this
     *   type or be sub-types of it.
     * @param {Object} resourceOrCollection - The changed Resource or Collection
     *   of resources. Should only have the fields that are changed.
     */
    value: function update(parentType, resourceOrCollection) {
      var _this3 = this;

      // It'd be faster to bypass Mongoose Document creation & just have mongoose
      // send a findAndUpdate command directly to mongo, but we want Mongoose's
      // standard validation and lifecycle hooks, and so we have to find first.
      // Note that, starting in Mongoose 4, we'll be able to run the validations
      // on update, which should be enough, so we won't need to find first.
      // https://github.com/Automattic/mongoose/issues/860
      var model = this.getModel(this.constructor.getModelName(parentType));
      var singular = this.inflector.singular;
      var plural = this.inflector.plural;

      // Set up some data structures based on resourcesOrCollection
      var resourceTypes = [];
      var changeSets = {};
      var idOrIds = (0, _utilTypeHandling.mapResources)(resourceOrCollection, function (it) {
        changeSets[it.id] = it;
        resourceTypes.push(it.type);
        return it.id;
      });

      var mode = typeof idOrIds === "string" ? "findOne" : "find";
      var idQuery = typeof idOrIds === "string" ? idOrIds : { "$in": idOrIds };

      return (0, _q2["default"])(model[mode]({ "_id": idQuery }).exec()).then(function (docs) {
        var successfulSavesPromises = [];

        // if some ids were invalid/deleted/not found, we can't let *any* update
        // succeed. this is the beginning of our simulation of transactions.
        // There are two types of invalid cases here: we looked up one or more
        // docs and got none back (i.e. docs === null) or we looked up an array of
        // docs and got back docs that were missing some requested ids.
        if (docs === null) {
          throw new _typesAPIError2["default"](404, undefined, "No matching resource found.");
        } else {
          var idOrIdsAsArray = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
          var docIdOrIdsAsArray = Array.isArray(docs) ? docs.map(function (it) {
            return it.id;
          }) : [docs.id];

          if (!(0, _utilArrays.arrayValuesMatch)(idOrIdsAsArray, docIdOrIdsAsArray)) {
            var title = "Some of the resources you're trying to update could not be found.";
            throw new _typesAPIError2["default"](404, undefined, title);
          }
        }

        (0, _utilTypeHandling.forEachArrayOrVal)(docs, function (currDoc) {
          var newResource = changeSets[currDoc.id];

          // Allowing the type to change is a bit of a pain. If the type's
          // changed, it means the mongoose Model representing the doc must be
          // different too. So we have to get the data from the old doc with
          // .toObject(), change its discriminator, and then create an instance
          // of the new model with that data. We also have to mark that new
          // instance as not representing a new document, so that mongoose will
          // do an update query rather than a save. Finally, we have to do all
          // this before updating other attributes, so that they're correctly
          // marked as modified when changed.
          var currentModelName = currDoc.constructor.modelName;
          var newModelName = _this3.constructor.getModelName(newResource.type, singular);
          if (currentModelName !== newModelName) {
            var newDoc = currDoc.toObject();
            var NewModelConstructor = _this3.getModel(newModelName);
            newDoc[currDoc.constructor.schema.options.discriminatorKey] = newModelName;

            // replace the currDoc with our new creation.
            currDoc = new NewModelConstructor(newDoc);
            currDoc.isNew = false;
          }

          // update all attributes and links provided, ignoring type/meta/id.
          currDoc.set(util.resourceToDocObject(newResource));

          successfulSavesPromises.push(_q2["default"].Promise(function (resolve, reject) {
            currDoc.save(function (err, doc) {
              if (err) reject(err);
              resolve(doc);
            });
          }));
        });

        return _q2["default"].all(successfulSavesPromises);
      }).then(function (docs) {
        var makeCollection = resourceOrCollection instanceof _typesCollection2["default"];
        return _this3.constructor.docsToResourceOrCollection(docs, makeCollection, plural);
      })["catch"](util.errorHandler);
    }
  }, {
    key: "delete",
    value: function _delete(parentType, idOrIds) {
      var model = this.getModel(this.constructor.getModelName(parentType));
      var mode = "find",
          idQuery = undefined;

      if (!idOrIds) {
        return _q2["default"].Promise(function (resolve, reject) {
          reject(new _typesAPIError2["default"](400, undefined, "You must specify some resources to delete"));
        });
      } else if (typeof idOrIds === "string") {
        mode = "findOne";
        idQuery = idOrIds;
      } else {
        idQuery = { "$in": idOrIds };
      }

      return (0, _q2["default"])(model[mode]({ "_id": idQuery }).exec()).then(function (docs) {
        (0, _utilTypeHandling.forEachArrayOrVal)(docs, function (it) {
          it.remove();
        });
        return docs;
      })["catch"](util.errorHandler);
    }
  }, {
    key: "addToRelationship",

    /**
     * Unlike update(), which would do full replacement of a to-many relationship
     * if new linkage was provided, this method adds the new linkage to the existing
     * relationship. It doesn't do a find-then-save, so some mongoose hooks may not
     * run. But validation and the update query hooks will work if you're using
     * Mongoose 4.0.
     */
    value: function addToRelationship(type, id, relationshipPath, newLinkage) {
      var model = this.getModel(this.constructor.getModelName(type));
      var update = {
        $addToSet: _defineProperty({}, relationshipPath, { $each: newLinkage.value.map(function (it) {
            return it.id;
          }) })
      };
      var options = { runValidators: true };

      return _q2["default"].ninvoke(model, "findOneAndUpdate", { "_id": id }, update, options)["catch"](util.errorHandler);
    }
  }, {
    key: "removeFromRelationship",
    value: function removeFromRelationship(type, id, relationshipPath, linkageToRemove) {
      var model = this.getModel(this.constructor.getModelName(type));
      var update = {
        $pullAll: _defineProperty({}, relationshipPath, linkageToRemove.value.map(function (it) {
          return it.id;
        }))
      };
      var options = { runValidators: true };

      return _q2["default"].ninvoke(model, "findOneAndUpdate", { "_id": id }, update, options)["catch"](util.errorHandler);
    }
  }, {
    key: "getModel",
    value: function getModel(modelName) {
      if (!this.models[modelName]) {
        // don't use an APIError here, since we don't want to
        // show this internals-specific method to the user.
        var err = new Error("The model \"" + modelName + "\" has not been registered with the MongooseAdapter.");
        err.status = 404;
        throw err;
      }
      return this.models[modelName];
    }
  }, {
    key: "getTypesAllowedInCollection",
    value: function getTypesAllowedInCollection(parentType) {
      var parentModel = this.getModel(this.constructor.getModelName(parentType, this.inflector.singular));
      return [parentType].concat(this.constructor.getChildTypes(parentModel, this.inflector.plural));
    }
  }, {
    key: "getRelationshipNames",

    /**
     * Return the paths that, for the provided type, must always must be filled
     * with relationship info, if they're present. Occassionally, a path might be
     * optionally fillable w/ relationship info; this shouldn't return those paths.
     */
    value: function getRelationshipNames(type) {
      var model = this.getModel(this.constructor.getModelName(type, this.inflector.singular));
      return util.getReferencePaths(model);
    }
  }], [{
    key: "docsToResourceOrCollection",

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
      var _this4 = this;

      // if docs is an empty array and we're making a collection, that's ok.
      // but, if we're looking for a single doc, we must 404 if we didn't find any.
      if (!docs || !makeCollection && Array.isArray(docs) && docs.length === 0) {
        throw new _typesAPIError2["default"](404, undefined, "No matching resource found.");
      }

      docs = !Array.isArray(docs) ? [docs] : docs;
      docs = docs.map(function (it) {
        return _this4.docToResource(it, pluralizer, fields);
      });
      return makeCollection ? new _typesCollection2["default"](docs) : docs[0];
    }
  }, {
    key: "docToResource",

    // Useful to have this as static for calling as a utility outside this class.
    value: function docToResource(doc, pluralizer, fields) {
      var _this5 = this;

      if (pluralizer === undefined) pluralizer = _pluralize2["default"].plural;

      var type = this.getType(doc.constructor.modelName, pluralizer);
      var refPaths = util.getReferencePaths(doc.constructor);
      var schemaOptions = doc.constructor.schema.options;

      // Get and clean up attributes
      // Note: we can't use the depopulate attribute because it doesn't just
      // depopulate fields _inside_ the passed in doc, but can actually turn the
      // doc itself into a string if the doc was originally gotten by population.
      // That's stupid, and it breaks our include handling.
      // Also, starting in 4.0, we won't need the delete versionKey line:
      // https://github.com/Automattic/mongoose/issues/2675
      var attrs = doc.toJSON({ virtuals: true });
      delete attrs.id; // from the id virtual.
      delete attrs._id;
      delete attrs[schemaOptions.versionKey];
      delete attrs[schemaOptions.discriminatorKey];

      // Delete attributes that aren't in the included fields.
      // TODO: Some virtuals could be expensive to compute, so, if field
      // restrictions are in use, we shouldn't set {virtuals: true} above and,
      // instead, we should read only the virtuals that are needed (by searching
      // the schema to identify the virtual paths and then checking those against
      // fields) and add them to newAttrs.
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

      // Build relationships
      var relationships = {};
      var getProp = function getProp(obj, part) {
        return obj[part];
      };

      refPaths.forEach(function (path) {
        // skip if applicable
        if (fields && fields[type] && !(0, _utilArrays.arrayContains)(fields[type], path)) {
          return;
        }

        // get value at the path w/ the reference, in both the json'd + full docs.
        var pathParts = path.split(".");
        var jsonValAtPath = pathParts.reduce(getProp, attrs);
        var referencedType = _this5.getReferencedType(doc.constructor, path);

        // delete the attribute, since we're moving it to relationships
        (0, _utilMisc.deleteNested)(path, attrs);

        // Now, since the value wasn't excluded, we need to build its
        // RelationshipObject. Note: the value could still be null or an empty
        // array. And, because of of population, it could be a single document or
        // array of documents, in addition to a single/array of ids. So, as is
        // customary, we'll start by coercing it to an array no matter what,
        // tracking whether to make it a non-array at the end, to simplify our code.
        var isToOneRelationship = false;

        if (!Array.isArray(jsonValAtPath)) {
          jsonValAtPath = [jsonValAtPath];
          isToOneRelationship = true;
        }

        var linkage = [];
        jsonValAtPath.forEach(function (docOrIdOrNull) {
          var idOrNull = undefined;

          // if it has an ._id key, it's a document.
          if (docOrIdOrNull && docOrIdOrNull._id) {
            idOrNull = String(docOrIdOrNull._id);
          } else {
            // Even though we did toJSON(), id may be an ObjectId. (lame.)
            idOrNull = docOrIdOrNull ? String(docOrIdOrNull) : null;
          }

          linkage.push(idOrNull ? { type: referencedType, id: idOrNull } : null);
        });

        // go back from an array if neccessary and save.
        linkage = new _typesLinkage2["default"](isToOneRelationship ? linkage[0] : linkage);
        relationships[path] = new _typesRelationshipObject2["default"](linkage);
      });

      // finally, create the resource.
      return new _typesResource2["default"](type, doc.id, attrs, relationships);
    }
  }, {
    key: "getModelName",
    value: function getModelName(type) {
      var singularizer = arguments[1] === undefined ? _pluralize2["default"].singular : arguments[1];

      var words = type.split("-");
      words[words.length - 1] = singularizer(words[words.length - 1]);
      return words.map(function (it) {
        return it.charAt(0).toUpperCase() + it.slice(1);
      }).join("");
    }
  }, {
    key: "getType",

    // Get the json api type name for a model.
    value: function getType(modelName) {
      var pluralizer = arguments[1] === undefined ? _pluralize2["default"].plural : arguments[1];

      return pluralizer(modelName.replace(/([A-Z])/g, "-$1").slice(1).toLowerCase());
    }
  }, {
    key: "getReferencedType",
    value: function getReferencedType(model, path) {
      var pluralizer = arguments[2] === undefined ? _pluralize2["default"].plural : arguments[2];

      return this.getType(util.getReferencedModelName(model, path), pluralizer);
    }
  }, {
    key: "getChildTypes",
    value: function getChildTypes(model) {
      var _this6 = this;

      var pluralizer = arguments[1] === undefined ? _pluralize2["default"].plural : arguments[1];

      if (!model.discriminators) return [];

      return _Object$keys(model.discriminators).map(function (it) {
        return _this6.getType(it, pluralizer);
      });
    }
  }, {
    key: "getStandardizedSchema",
    value: function getStandardizedSchema(model) {
      var _this7 = this;

      var pluralizer = arguments[1] === undefined ? _pluralize2["default"].plural : arguments[1];

      var schemaOptions = model.schema.options;
      var versionKey = schemaOptions.versionKey;
      var discriminatorKey = schemaOptions.discriminatorKey;
      var virtuals = model.schema.virtuals;
      var schemaFields = [];

      var getFieldType = function getFieldType(path, schemaType) {
        if (path === "_id") {
          return new _typesDocumentationFieldType2["default"]("Id", false);
        }

        var typeOptions = schemaType.options.type;
        var holdsArray = Array.isArray(typeOptions);
        var baseType = holdsArray ? typeOptions[0].type.name : typeOptions.name;
        var refModelName = util.getReferencedModelName(model, path);

        return !refModelName ? new _typesDocumentationFieldType2["default"](baseType, holdsArray) : new _typesDocumentationRelationshipType2["default"](holdsArray, refModelName, _this7.getType(refModelName, pluralizer));
      };

      model.schema.eachPath(function (name, type) {
        if ((0, _utilArrays.arrayContains)([versionKey, discriminatorKey], name)) {
          return;
        }

        var fieldType = getFieldType(name, type);
        name = name === "_id" ? "id" : name;
        var likelyAutoGenerated = name === "id" || fieldType.baseType === "Date" && /created|updated|modified/.test(name) && typeof type.options["default"] === "function";

        var defaultVal = undefined;
        if (likelyAutoGenerated) {
          defaultVal = "__AUTO__";
        } else if (type.options["default"] && typeof type.options["default"] !== "function") {
          defaultVal = type.options["default"];
        }

        // Add validation info
        var validationRules = {
          required: !!type.options.required,
          oneOf: type.options["enum"] ? type.enumValues : undefined,
          max: type.options.max ? type.options.max : undefined
        };

        type.validators.forEach(function (validator) {
          _Object$assign(validationRules, validator.JSONAPIDocumentation);
        });

        schemaFields.push(new _typesDocumentationField2["default"](name, fieldType, validationRules, _this7.toFriendlyName(name), defaultVal));
      });

      for (var virtual in virtuals) {
        // skip the id virtual, since we properly handled _id above.
        if (virtual === "id") {
          continue;
        }

        // for virtual properties, we can't infer type or validation rules at all,
        // so we add them with just a friendly name and leave the rest undefined.
        // The user is expected to override/set this in a resource type description.
        schemaFields.push(new _typesDocumentationField2["default"](virtual, undefined, undefined, this.toFriendlyName(virtual)));
      }
      return schemaFields;
    }
  }, {
    key: "toFriendlyName",
    value: function toFriendlyName(pathOrModelName) {
      var ucFirst = function ucFirst(v) {
        return v.charAt(0).toUpperCase() + v.slice(1);
      };

      // pascal case is "upper camel case", i.e. "MyName" as opposed to "myName".
      // this variable holds a normalized, pascal cased version of pathOrModelName,
      // such that `ModelFormat`, `pathFormat` `nested.path.format` all become
      // ModelFormat, PathFormat, and NestedPathFormat.
      var pascalCasedString = pathOrModelName.split(".").map(ucFirst).join("");

      // Now, to handle acronyms like InMLBTeam, we need to define a word as a
      // capital letter, plus (0 or more capital letters where the capital letter
      // is not followed by a non-capital letter or 0 or more non capital letters).
      var matches = undefined;
      var words = [];
      var wordsRe = /[A-Z]([A-Z]*(?![^A-Z])|[^A-Z]*)/g;

      while ((matches = wordsRe.exec(pascalCasedString)) !== null) {
        words.push(matches[0]);
      }

      return words.join(" ");
    }
  }]);

  return MongooseAdapter;
})();

exports["default"] = MongooseAdapter;
module.exports = exports["default"];