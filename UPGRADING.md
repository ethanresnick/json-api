# 3.0.01-rc.3
## Breaking Changes
- The function signatures for `beforeSave` and `beforeRender` have been refactored considerably. Each function now receives four arguments `(it, meta, extras, superFn)`, where `it` refers to the object (either a `Resource` or `ResourceIdentifier`) to be transformed; `meta` refers to a [`TransformMeta` object](https://github.com/ethanresnick/json-api/blob/dae6b8c9cb08feaa785b56327f51aaf22aeee5ac/src/types/Document.ts#L37); `extras` is an object full of members like the raw serverRequest, the ResourceTypeRegistry, [etc](https://github.com/ethanresnick/json-api/blob/274ee135d9886afaaa304d58f51df64d56cf2547/src/steps/make-transform-fn.ts#L10); and `superFn` is a function you can call to invoke the parent type's transform. This is quite from the previous `(it, frameworkReq, frameworkRes, superFn, extras, meta)` signature. This change has been long-planned (though the depd module didn't provide a good way to provide a warning about it), and updating your code should be mechanical.

- Likewise, the function signature for the `superFn` function is now `(it, meta)` rather than just `(it)`. That is, you must explicitly pass along the transform meta when calling the super function.

## New Features
- Query and result factories receive a partially applied version of the (resource-type-agnostic) `beforeSave` and `beforeRender` functions, which can be convenient.

# 3.0.01-rc.2.0.1
- MongooseAdapter: adds more information about the source of errors to the errors' `meta` key.

# 3.0.0-rc.2
This release:

- Adds support for `geoWithin` filters to the mongoose adapter. E.g., you can do `GET /organizations?filter=(location,geoWithin,([0,0],toGeoCircle,4000))`, where `[0,0]` is a `[lng,lat]` coordinate and `4000` is a radius in meters.
- Provides more precise return types for adapter methods.
- Exports additional types that may be useful to TS users.
- Provides slightly more information about the request to query param parsers.

None of the changes should be breaking, except perhaps for Typescript users whose code doesn't match the more precise types.

# 3.0.0-rc.1
With this release, all major API changes for v3 are done. Between now and the final release of v3, the plan is to:
- remove deprecated APIs;
- fix known bugs;
- update underlying dependencies dependencies (e.g., Mongoose)
- that's about it, though it's possible some other small API tweaks might happen.

## Breaking Changes
The big change in this release is that Adapter methods now return results in a different format, and the `Query.returning` method receives the results in the new format. If you were reading/destructuring the arguments to `Query.returning`, you'll need to update your code accordingly. The new format is documented in `src/db-adapters/AdapterInterface.ts`. 

# 3.0.0-beta.26
## New Features
- Users can now provide a custom sort parameter parser, much like the custom filter parameter parsers already supported. Additionally, these parsers are allowed to parse "sort fields", as JSON:API calls them, that represent computed values, instead of simple field references. The format for these new sort fields is `{ expression: FieldExpression, direction: "ASC" | "DESC" }`, compared to the other (and still valid) `{ field: string, direction: "ASC" | "DESC" }` format.
- The `MongooseAdapter` now supports a `geoDistance` operator that can be used in `?sort`. E.g., `GET /organizations?sort=(location,geoDistance,[lng,lat])` will sort all organizations by their distance from the user-provided `[lng,lat]` coordinate. See tests for some caveats here.

## Breaking Changes
- Because the `MongooseAdapter` allows the `geoDistance` operator in the `?sort` parameter, it's now possible that users of that adapter will see an `{ expression, direction }` sort field in `Query` objects, or in the parsed value at `request.queryParams.sort`. If you were reading/transforming that value or query objects and assuming that sort fields would always have a `field` key, then support for these new `{ expression, direction }` sort objects is a breaking change.
- Similarly, Typescript users will find that the type for parsed sort values has been expanded to encompass the new `{ expression, direction }` possibility. You may need to adjust your code accordingly. Some other types have also been tweaked.
	- Note: an adapter must explicitly declare, in `Adapter::supportedAdapters`, which operators, if any, it supports in `?sort`. If an adapter doesn't declare any operators as supported there, then it doesn't have to worry about encountering `{ expression, direction }` sort field objects in the queries it receives, as the sort parser will mark attempts to use an operator as invalid.
- The API controller no longer has a static `defaultFilterParamParser` method. Instead, this function is just a named export from the same file. 

# 3.0.0-beta.25
## Breaking Changes
### `singular` => `isSingular` Rename
- `FindQuery.singular` and `DeleteQuery.singular` have been renamed to `FindQuery.isSingular` and `DeleteQuery.isSingular`. Likewise, the argument passed in during query construction has been renamed `isSingular` instead of `singular`.
 
### Filtering
#### For API Clients
- Filtering now uses a slightly different syntax. See https://github.com/ethanresnick/json-api/issues/160 for details.

#### For Query Creation/Transforms
- If you were manually creating a Query object with filters applied, or inspecting/transforming the filters on an existing Query (including using the built-in methods like `andWhere`), you should know that the format for filter constraint objects has now changed slightly. In particular, before the format was `{ field: string | undefined, operator: string, value: any }`; now, it's simply `{ operator: string, args: any[] }`. And, within `args`, references to fields are represented with an `Identifier` type, to differentiate them from strings, so you have to read the `identifier.value` to get the field name. This format is more flexible going forward (e.g, it allows more than one operand to be a field reference). The effect of these changes are that:

    1. When reading filter constraints, **when the operator is not `and` or `or`, you should be able to pretty mechanically replace `filterConstraint.field` with `filterConstraint.args[0].value`, and `filterConstraint.value` with `filterConstraint.args[1]`. Likewise, when the operator is `and` or `or`, you should be able able to replace `constraint.value` with `constraint.args`.** These replacements work because, for all the built-in binary operators, you can rely on `args[0]` being an `Identifier`, and `args[1]` being a plain value; this is because the arguments are validated immediately after the parsing process, and the built-in validation function enforces these invariants. (Custom adapters can override that if they wish.) Similarly, you can rely on the args for "and"/"or" expressions being an array of filter constraints.
    
    2. For creating filter constraint objects and adding them to/removing them from queries, you'll likely want to import the `Identifier` and `FieldExpression` constructor functions from the `json-api` package and replace `{ field: "a", value: x, operator: y }` with `FieldExpression(y, [Identifier("a"), x])`.

#### For Typescript Users
- The FieldConstraint and FieldPredicate types have been unified into a new FieldExpression type, per the note above about a new filter constraint format.

# 3.0.0-beta.24
## Breaking Changes
- Error messages thrown/reported to the user for mongoose ValidationError's have been improved, but this means that you may now need to update how you test for specific errors. In particular: 
    - if a required field is missing, the `typeUri` on the generated APIError is now "https://jsonapi.js.org/errors/missing-required-field" instead of "https://jsonapi.js.org/errors/invalid-field-value". The `title` is also different (to note that the value is missing, not invalid). Other properties are the same.

    - if the error arises from you throwing an `APIError` (e.g., in a custom validator), that error is used. Similarly, if you throw an Error marked as displaySafe, it's converted to an APIError, and that result is used. Before, a more generic error was used.

    - if the error arises from an error thrown in a custom validator/setter, and that error is not an instance of `MongooseError`, a generic message is used for the `detail`, rather than leaking the error's raw message to user. The `rawError` property on the generated APIError in this case now points directly to the thrown error (not the error mongoose generated when catching it).

# 3.0.0-beta.23
Note: betas 21 and 22 contained only small bugfixes; no breaking changes.

## New Features
- Support APIError.source, use it for query parameter errors

## Breaking changes
- Replace the `ErrOrErrArr` (type) export from the API controller file with an `ErrorOrErrorArray` export in the `src/types/index.ts` file. This only effects Typescript users.

# 3.0.0-beta.20
## New features
- Url templates can be passed as functions to the ResourceTypeRegistry.
- Global configuration related to error handling can now be passed to the registry, including a template function for generating `about` links. Accordingly, `APIError.links` has been deprecated. 
- APIError's have an optional `typeUri` field which can hold a URI identifying the type of the error. If present, this is serialized as the `code` field. On construction, `typeUri` should be provided instead of `code` field, which has been deprecated.
- APIError's can be constructed with a `rawError` option that holds an error object with more details. This raw error won't be serialized, but can be used downstream to further refine the APIError's message/other data.

## Breaking changes
- Many error titles have been rewritten, and Mongo unique constraint violation errors now reach `query.catch` as APIError's, not Mongo errors as before. If you or your clients were detecting specific errors, these changes may break your detection strategies. Use the new `apiError.toJSON().code` to distinguish error types. The `code` for Mongo unique constraint violation errors is: https://jsonapi.js.org/errors/unique-error

- `APIError.paths` has been removed (this was non-standard).

- `ResourceTypeRegistry.urlTemplates` now returns each template as a function, rather than in its unparsed string form. The string form is available (for templates created from strings) at the function's `RFC6570String` symbol, which is exported by the library's index file.

- Some types related to URL templates have been renamed.

All of the changes below are very unlikely to effect you:

- `ResourceTypeRegistry` cross-type defaults can no longer be provided as an Immutable.js Map. Use a plain js object instead.
- The `ResourceTypeRegistry.behaviors()` method has been removed. It wasn't being used for anything by the library.
- Links are no longer parsed from request documents. If you were reading links sent by the client, please open an issue describing your use case (I'm very curious!).

# 3.0.0-beta.19
- "Result factories" have been added as a new feature. See https://github.com/ethanresnick/json-api/commit/c02b9a96f6c7baeac936e426f5714239c19fc723
- The long-deprecated `ExpressStrategy.transformedAPIRequest` method has been removed. However, query transform functionality is still available through the `customAPIRequest` method, and there's a very mechanical way to update: simply replace all calls to `strategy.tranformedAPIRequest(queryTransform)` with `strategy.customAPIRequest({ queryTransform: queryTransform })`.

# 3.0.0-beta.18
- `beforeSave`/`beforeRender` now receive an additional argument providing some metadata about the resource/identifier being transformed. At the moment, this metadata is simply what section of the document ("included" or "primary") the the resource/identifier is from.
- Some protected methods of the `MaybeDataWithLinks` class has been renamed. If you were subclassing this class (which you probably shouldn't, as it's really an internal detail), you may have to update your code.

# 3.0.0-beta.14 – 3.0.0-beta.17
- Support sending requests with already-parsed bodies into ExpressStrategy
- Other small new features and typings improvements
- Bugfixes

# 3.0.0-beta.13
## Breaking Changes
### MongooseAdapter/AdapterInterface
- The second argument to `MongooseAdapter`'s constructor, if provided, must now be a function that returns a type name when given a mongoose model name. Previously, the argument was a function that pluralized its input.
- `MongooseAdapter.getModelName` has been removed. `Adapter.getModelName` is no longer a required function on the adapter interface. If you were customizing the pluralization/singularization behavior of the adapter, you may want to provide a function for the new `toModelName` argument on the `DocumentationController`'s constructor.
- `AdapterInterface.getModel` now takes a type name instead of a model name as its argument. `MongooseAdapter.getModel` has been updated accordingly.

# 3.0.0-beta.11
## New Features
- Improved subtype handling (see #149)

## Breaking Changes
### Subtypes
By far the biggest breaking change in this beta is how the library handles subtypes (i.e., resource types registered with another resource type as their parent type). For details on the problem that needed to be solved and the approach taken, see https://github.com/ethanresnick/json-api/issues/149.

**If you're not using subtypes, none of these changes should effect you, unless you're using query factories (in which case you may need to do some mechanical work to set the new `typePath` property; see below).**

Here are the most important changes:

- In the past, a `Resource` instance's `type` field held the name of its subtype; now, it holds the name of the parent-most type that the resource belongs to. **The serialized JSON `type` key for the resource is now also the root most type, no the subytpe.** The subtypes are instead stored in `Resource.typePath`. They're then serialized to (and, on create, parsed from) `resourceJSON.meta.types`.

- If you're constructing a `Resource` instance yourself (e.g., in a query factory), you must be very careful to set `typePath` correctly, as its used to run the appropriate `beforeSave`/`beforeRender` functions and potentially mongoose validation. See the [Resource class](https://github.com/ethanresnick/json-api/blob/v3-evolution-over-rewrite/src/types/Resource.ts) for more details on its format, and the distinction between it and the `typeList`. To help setting the type path, query factory functions are now passed a function (at the `setTypePaths` key of their first argument) that, if passed an array of `Resource`s will mutate them to set their type paths correctly. It can set the type path of existing resources by looking their type paths up in the adapter, or can validate + save a list of user-provided types at the type a resource is being created.

- If you were using linkage transforms, and some of your linkage was serialized to JSON with a subtype in its `type` key (rare, but it could happen if your Mongoose model `ref` referred to a child model), that linkage was previously transformed with the beforeSave/beforeRender functions from the subtype's resource description. Now, it'll be transformed only with the beforeSave/beforeRender functions of the parent type's description, and only if that type has `transformLinkage: true` set. It'll also always be serialized with the parent type's name in its `type` key, so that it points to the appropriate resource.

### Custom Adapters
If you've written a custom adapter.... 

- You must now implement an instance method called `getTypePaths`. See MongooseAdapter for an example, and the AdapterInterface file for the signature. If you aren't supporting subtypes, you can generate the typePath for each input item by simply making a one-item array with the serialized, JSON:API `type` value.

- If you want to support subtypes, you must update your methods that return `Resource`s to return the parent type in `type` and the type path in `typePath`. Also, you must update your query methods (create/update/delete/addToRelationship/removeFromRelationship) to be aware of the `typePath` key. The library will guarantee that the resources passed in the query to `adapter.create` and `adapter.update` have a true type (i.e., their smallest type) of `Query.type` or one of its subtypes, but you otherwise must validate the data yourself. Note that `Query.type` still represents whatever type the query is scoped to (likely based on `request.params.type`), and could be a subtype.

- Finally, you must provide an instance method called `getModelName`. (Before, this was required as a static method; that is no longer needed.)

- If you were subclassing MongooseAdapter, see below for the changes to it.

### Multiple Adapters
- Using multiple adapters simultaneously (i.e., different ones for different resource types) is no longer possible, for the moment. The fix isn't too hard, though, so open an issue if having this feature is important.

### MongooseAdapter
- You must now use a mongoose version greater than 4.8.0. Versions between 4.8.x and 5 are known to work. Versions 5+ haven't been tested yet, but may work.

- Removed `MongooseAdapter`'s static `getChildTypes` method and `getTypesAllowedInCollection` instance method. The ResourceTypeRegistry can  figure out the parent and child types based on the type descriptions provided to it, so there's no point in making adapters implement these methods. See the new methods on ResourceTypeRegistry if you need/were using this functionality.

- Removed various static `MongooseAdapter` methods (e.g. `docToResource`, `getType`, `getReferencedType`) from the class; they're now utility methods instead in a separate file. None of these methods were intended to be part of the class's public API (though that wasn't clearly defined), so hopefully this breakage isn't too bad. Open an issue if you were depending on these for some reason.

## Deprecations
- `ResourceTypeRegistry::parentType`. Use `parentTypeName` instead.

# 3.0.0-beta.9
## Breaking Changes
- Update Jade to Pug 2. See https://pugjs.org/api/migration-v2.html

# 3.0.0-beta.5 through 3.0.0-beta.8
## New Features
- The library's types are exported from the main file in a way that should be more convenient for use with ESM and Typescript. Note: this shouldn't break current code to import the module, but module loading in our not-quite-ESM world is tricky, so lmk if something broke.
- The `MaybeDataWithLinks` class now has an `unwrapDataWith` method for convenience.

## Breaking Changes
- The server will no longer return duplicate resources in the `included` section. This is more compliant with the JSON:API spec, and shouldn't harm clients, but it is technically a breaking change.
- The `AddToRelationshipQuery` and `RemoveFromRelationshipQuery` classes now take a `ResourceIdentifier[]` as their `linkage` property, rather than a `Data<ResourceIdentifier>`. If you were manually reading/setting this property in a query transform or query factory, please update your code accordingly.
- Adding an `isJSONAPIDisplayReady` property to error objects to signal that their details can be shown to the user is deprecated; throw a proper APIError instead or use the symbol property exported from the APIError class.

# 3.0.0-beta.4

## New Features
- Instead of the library constructing an initial query from the request, which you can then provide a function to transform, you can provide a function that dictates how to construct the initial query itself. (Of course, that function can use the library's built-in logic to create a query, and then transform that result, thereby recreating the same functionality as previously.) This is a subtle but important difference described in [569fa64](https://github.com/ethanresnick/json-api/commit/569fa643aca1d1add64402495179ebb939d40b7a). To use this feature, the ExpressStrategy provides a new `customAPIRequest` method, which takes a `queryFactory` option. See that file for details. Now that `customAPIRequest` exists, `transformedAPIRequest` is deprecated. See [/test/app/src/index.ts](https://github.com/ethanresnick/json-api/blob/569fa643aca1d1add64402495179ebb939d40b7a/test/app/src/index.ts#L121) for an example of how to use the new function, and see the new implementation of `transformedAPIRequest` in ExpressStategy for a sense of how to upgrade.

- The APIController, and the ExpressStrategy, now have functions for sending a JSON:API any `Result` back to the user. This is convenient if you ahve a `Result` that you created manually or that otherwise came from somewhere other than executing a query in `APIController.handle`.
 
- The public methods on the Express strategy are now bound methods, so you no-longer have to bind their `this` when passing them around. 

- The library now prints deprecation warnings using the `depd` module.

## Breaking Changes
- Query.returning and query.catch can now be async (returning a `Promise<Result>` rather than a `Result` directly). Accordingly, if you were composing with one of those functions, you'll now have to `await` the return value.

- Request body and query parsing now happen slightly earlier than before. Accordingly, if the user's request had multiple errors (e.g. an invalid body and an invalid method), the error returned may be different than before, because the first check that fails is the one whose error is reported. 

- The library's internal `Request` object no longer has a `primary` key; instead it has a `document` key which holds the whole request body parsed as a `Document` instance (or undefined for requests with no body). This lays the ground work for supporting sideposting and other features where there's query-related data in the request document outside of the primary data.

- In the fifth argument passed to user-defined `beforeSave` and `beforeRender` functions, which is an object, the request and response objects generated by your HTTP framework (e.g., express, hapi, node) should now be accessed at the `serverReq` and `serverRes` properties, rather than `frameworkReq` and `frameworkRes`. Those old names are deprecated and will be removed when v3 launches.

- `ExpressStrategy.sendError` should now be provided with the `next` function as an argument; not providing this will be an error when v3 is finalized.

- On `APIController` signature of `handle` method has changed, and the `responseFromExternalError` method has been renamed to `responseFromError`. These changes should only effect you if you have written a custom HTTP strategy.
 
# 3.0.0-beta.3

## Bugfixes
- MongooseAdapter now correctly respects the `singular` property of find and delete queries.

## Breaking Changes
- On `FindQuery` and `DeleteQuery` instances:
  - The `getFilters` method now returns a deep clone of the filters, rather than a shallow clone, so mutating the result is safe.
  - The `getIdOrIds` method no longer exists; just get the filters with the `getFilters` method and filter the result as needed.
  - Relatedly, the `getFilters` method now no longer takes an argument to exclude filters that apply to the `id` field; you can easily recreate this yourself.
  - The `matchingIdOrIds` method no longer forces the query to be `singular: false` when an array of ids to match is provided, or when `undefined` is provided. This very likely won't effect you, as queries default to `singular: false` anyway unless you construct them with a single id filter or with an explicit `singular: true` constructor argument.


# 3.0.0-beta.2

## Breaking Changes
- `ResourceIdentifier`'s are now constructed with two arguments (type, id), rather than a single object with a type and id key. This is to be consistent with the `Resource` constructor.
- `APIError.fromError` now sets the `detail` property of the returned error by using the `detail` property of the passed in Error and only falling back to the `details` property if `detail` is not set. Before, it prefered `details`.
- `Document` instances are no longer constructed with the request URI as an argument (which was used to set the top-level self link). Instead, the top-level self link should be set like all other top-level links: by storing a self template on the value in `Document.primary`.

# 3.0.0-beta.1

## New Features
- Linkage can be transformed on a per-type basis with an opt-in. Addresses https://github.com/ethanresnick/json-api/issues/28. See README.
- Your `beforeRender` and `beforeSave` functions can return undefined on requests for/inputs of a single resource to remove the resource, just like they can on multi-resource requests. If you remove the only resource from a single resource request, the result is a 200 response with `data: null`. (If you need an error, you can map `null` to that with a query transform, but there's no way for the library to know the appropriate error). Addresses https://github.com/ethanresnick/json-api/issues/105.

## Breaking Changes (From 3.0.0-alpha.13)
This beta removes support for label mappers. It also substantially reworks many of the library's underlying types. However, the type changes have mostly left the surface API unchanged and they should only effect you if:

- You are doing query transforms that examine/modify the data in the query. This data was represented by a `Resource` or `Collection` or `Linkage` type instance before, but is now represented by the new `Data` type.

- You are doing query transforms that change how the adapter results are put into the response, using `query.returning/query.resultsIn`. The arguments to your `returning` function will now be different (again, `Resource`, `Collection`, and `Linkage` instances will be replaced by `Data` instances) and the types of the `primary`/`included` keys of the document you're likely returning are now different.

- You are manually instantiating/testing for/modifying `Relationship` or `Linkage` instances in `beforeSave` or `beforeRender`. The `Linkage` type has been removed and the `Relationship` type substantially refactored.

See details below, and feel free to open an issue if you can't make something work.

### Global
- Removed support for label mappers. Use query transforms instead for better performance and maintainability. This resulted in the removal of `Request.allowLabel` and `ResourceTypeRegistry.labelMappers()`.
- Query objects are now constructed with either an `id` or an `ids` option, rather than a single `idOrIds` option.

### New & Removed Types
- A new, highly-generic type called `Data` has been introduced. It provides a uniform, monadic interface for transforming items inside it, obviating the need for the old `Collection` and `Linkage` types, which can now be represented as `Data<Resource>` and `Data<ResourceIdentifier>` respectively. See the comoment at the top of the `Data.ts` file for more details.

- Accordingly, the `Collection` and `Linkage` types have been removed, and the `Relationship` type, which previously stored link templates along with a `Linkage` instance, now stores link templates along with a `Data` instance.

- A new type called `ResourceSet` has been introduced, which parallels the basic structure of `Relationship` -- a `Data` plus some links -- except that the data here is a `Data<Resource>`. This makes it possible to associate a set of links with a set of `Resource`s (rather than each individual Resource's links), opening the door for custom top-level `links`, which wasn't previously possible.

- The result of all of the above is that various places in the code that previously could hold either a `Resource` or `Collection` at runtime now always hold a `Data<Resource>`. For example:
  -  `Document.included`, `UpdateQuery.patch`, and `CreateQuery.records` now expect a `Data<Resource>`
  -  `Adapter.create`, `Adapter.update`, and `Adapter.delete` now return a `Data<Resource>`; the first item in the tuple returned by `Adapter.find` is also a `Data<Resource>`. 

- Meanwhile, places that always held/returned a `Collection` (e.g. `Document.included`) now simply hold a `Resource[]`; they don't need to/shouldn't hold a `Data<Resource>` because having a singular one isn't possible. In this spirit, the second item in the tuple returned by `Adapter.find` is also now a `Resource[]`.

### Relationship Type
- The `Relationship` type is now constructed using the static `Relationship.of` method rather than `new Relationship()`. See source for details.
- `Relationship`s must now be constructed with an `owner`, definining the resource (type, id) and relationship path that's the "source" of the linkage. This information is necessary to store to use as template data to render the Relationship's links. Previously, this data was missing, so the relationship's links couldn't be rendered (as top-level `links`) when the relationship was requested directly.
- The link templates provided to the `Relationship` are now passed in with a slightly different format, and must be _string-returning functions_ rather than RFC 6570 template stings. (The easiest way to satisfy this is to parse the the RFC 6570 template into a function.)

### Document type
- `Document` instances are now constructed with url templates provided as functions, rather than raw template strings. This shouldn't matter unless you were constructing Documents manually. 
- `Document.primary`, wich previously held a `Resource | Collection | Relationship` now holds a `Relationship | ResourceSet`. (It holds a `ResourceSet` rather than a `Data<Resource>` to support the possibility of top-level links, as mentioned above.)
- As mentioned above, `Document.included` is now a `Resource[]`.

### Request type
- The Request type is now a simple object literal rather than a class (the class ceremony wasn't buying us anything beyond extra boilerplate and a more involved construction process). If you were (for some reason) manaully constructing Request object, you'll need to update your logic.
- `Request.idOrIds` is now simply `Request.id` (as multiple ids were only used with label mappers).
- `Request.needsBody` no longer exists; this wasn't actually being used by anything internally. `Request.hasBody` has also been removed; if (and only if)the request doesn't have a body, `Request.body` be undefined.
- `Request.contentType` will now be set if the HTTP request included a content-type header, even if there was no body. Also, when a content-type header is missing `Request.contentType` will now be undefined rather than null.
- When an Accept header is missing, `Request.accepts` will now be undefined rather than null.

### FindQuery
- The second item in the first argument to the `FindQuery.returning` callback, which represents the included resources, is now `undefined`, rather than `null`, when no included resources are present.

# 3.0.0-alpha.1 to 3.0.0-alpha.13
## Breaking Changes
### Global
- Q.Promise has been replaced with the standard ES6 Promise throughout the API.
- The way to filter results using the `?filter` parameter has changed. The new scheme, which is documented in the README, is more concise and better integrated with the query transform system.

### Mongoose Behavior/MongooseAdapter
- The adapter now requires at least Mongoose v4.2.0, and is only tested with Mongoose 4.7.0 and up. (Previously, it used required 4.0.x).
- The adapter's methods now take a single query object, rather than a list of arguments. Unless you were calling adapter methods directly, this change shouldn't be observable.
- The `update` method (used on all PATCH requests) now issues a `findOneAndUpdate` for each changed document, rather than trying to find the document first and then save it back. This pattern should be faster. However, it means that your mongoose `save` validators will no longer be run; instead, the `findOneAndUpdate` validators will be run, with `this` set to be the query. By their nature, the `findOneAndUpdate` validator functions don't know about the existing state of the doc (only the update query), so they can't enforce validation constraints that rely on reading/comparing multiple fields. (E.g., you can't validate that startDate < endDate, because the update query might only set endDate.) If you need such validations, my strong recommendation is to do them at the database level, using Mongo's new-ish [document validation](https://docs.mongodb.com/manual/core/document-validation/) features. That's safer anyway, because, in the old approach, it's possible that the data could change between the read and the write, making the application-level validations give a false positive. Alternatively, I may add a "strict" update mode in the future, which could be opted-in to on a per model basis, that would increment some version field on every update. Then, it would load the document, validate it with the changes, and save the changes back but with a where clause verifying that the version hasn't changed between the read and the write.
- Because of a [bug](https://github.com/Automattic/mongoose/issues/5613) in Mongoose, an update can no longer change the type of a resource (which is probably a good thing anyway -- see [json-api/481](https://github.com/json-api/json-api/issues/862) and the followup in [json-api/862](https://github.com/json-api/json-api/issues/862)).
- On update, I removed the check that all documents with the targeted ids exist before trying to update any documents. This check didn't add much safety but required an extra query. Now, it's possible for some updates to succeed while others fail. (Note: the lack of true transactional updates is present throughout the library, as mongo doesn't support transactions.)
- The `addToRelationship` and `removeFromRelationship` methods now run their validators with `this` set to the update Query, rather than to null/undefined. If you were detecting whether `this` was null/undefined, this could be a breaking change. Now, instead of checking if `this` is null, check if it isn't an instance of `Mongoose.Query`.

### Koa + Express Strategies
- You should now provide a Host option when initializing the strategy, for security. See example in README. If you're running your API using express 4 on a host that includes a port number you **must** now provide this option.

### (Mostly-internal) Types
- The `HTTP/Response` class has been removed, and replaced with object literals with a simpler format (see HTTPResponse in `src/types/index.ts`) for the new structure. This should only be observable if you were subclassing the `Documentation` controller and defining a `transformTypeInfo` function that depended on the old Response structure. The argument to your function will now match the new structure.
- The `Document` class now has a different constructor signature and different class methods. This shouldn't be an issue unless you were manually constructing Document instances. See file for details.

### ResourceTypeRegistry
- The type descriptions -- which have always been private -- are now stored in a different instance property. If you want to get a type description, use `registry.type(typeName)`. To get the list of all registered types, use `registry.typeNames()`.

## New Features
### Global
- It's now possible to transform the query that the library builds from the request before that query is run, to support all sorts of advanced use cases. See an example [here](https://github.com/ethanresnick/json-api/blob/c418ebf0411774d61f74ff8752228d3a995e5456/test/app/src/index.ts#L35). It is also possible to transform how a query's result (whether it succeeds or fails) is mapped to the response by defining custom `returning` and `catch` methods on a query object (that may want to wrap the methods already there).
- The beforeSave and beforeRender transform functions are now called with an additional argument that holds an object with a `request` member, whose value is the internal request object used by the JSON:API library, and a `registry` member, whose value is the ResourceTypeRegistry.


# 2.15 -> 2.16 Breaking Changes  (Not Semver until 3.0)

### Global
- This library now requires at least Node v6. 
- Q.Promise's have been replaced with standard ES6 Promises in various places throughout the API.

### Response
- Response.headers.vary and Response.headers.location are not defined, rather than having a null value, if those headers aren't needed for the response.

### Koa Adapter
- User-defined transform functions--namely, beforeRender and beforeSave on resource type descriptions, and transformTypeInfo on (subclasses of) the Documentation controller--are now called with slightly different arguments when the Koa adapter is in use. Previously, these functions were called with the whole Koa context object as their second-to-last argument, and undefined as their last argument. Now, the second to last argument is just Koa's request object (`ctx.request`) and the last argument is Koa's response (`ctx.response`). This matches how the express adapter works.

# 2.14 -> 2.15 Breaking Changes  (Not Semver until 3.0)
### ResourceTypeRegistry
- All resource descriptions must now be passed at the time of construction, as an object whose keys are the type names. Passing an array to the constructor is no longer supported.
- All setter methods have been removed. Please set all your data before initializing the Registry.
- Resource type descriptions now inherit from the descriptions of their `parentType`. So if type B extends A, B will use A's `beforeSave`, `beforeRender`, `info`, etc. by default. The only exception is that `labelMappers` are not inherited. Among other things, this means that the JSON generated for sub-types now better reflects any `info` stored on the parent type's fields. (Addresses [#93](https://github.com/ethanresnick/json-api/issues/93) and [#18](https://github.com/ethanresnick/json-api/issues/18).)
- The `ResourceTypeRegistry.types()` method has been renamed to `ResourceTypeRegistry.typeNames()`
- For more details on the above, see [the relevant commit](https://github.com/ethanresnick/json-api/commit/35ae4ad4d05b5ddeaeb8bbccf1a6513584601a69).

# 2.13 -> 2.14 Breaking Changes (Not Semver until 3.0)
- If you were relying on the RelationshipObject class: the class has been renamed to simply "Relationship", and its fields `selfURI` and `relatedURI` have been renamed to `selfURITemplate` and `relatedURITemplate` respectively.
- URI Templates specified on a single Relationship instance now take precedence over resource-level templates during serialization

# 2.10 -> 2.13 Breaking Changes (Not Semver until 3.0)
- Please don't use versions 2.11 and 2.12; the new features outlined below were tweaked repeatedly over those versions, and 2.13 is their (more) stable iteration. Moreover, it's just as easy to upgrade from 2.10 to 2.13 as it would be to upgrade to 2.11 or 2.12.

- HTTP Strategies: If you are using your own HTTP strategy (including extending the built-in Express one), you must make sure that your strategy calls the Documentation controller's `handle()` method with two additional arguments: the request and response objects from the framework your strategy is for (i.e. from express, koa, etc). The built-in express strategy has already [been patched](https://github.com/ethanresnick/json-api/commit/c658f7ba7ee4ac11f1976a763f1bdabf4b501e34#diff-fa4912ea43328f16ddff5fc0c1781fb5L59) to support this change.

- Documentation controller: If you are using your own subclass of the Documentation controller, you must update it to be compatible with some small changes made there. In particular, a fourth constructor argument was added, and `handle()` now additionally calls the new `transformTypeInfo()` method. See the [updated file](https://github.com/ethanresnick/json-api/blob/0525598b087e4de6fca9674540f5296054960ac9/src/controllers/Documentation.js) for details.

# 2.9 -> 2.10 Breaking Changes (Not Semver until 3.0)
- [Very subtle changes](https://github.com/ethanresnick/json-api/commit/19e16edfb58ee2b5f2573a9e2d1d09cb73d05050) to how the request body is parsed and stored on the request object. You almost certainly don’t need to care about these changes.

# v2.8 -> 2.9 Breaking Changes (Not Semver until 3.0)
- APIController.responseFromExternalError() has a changed API
- Errors caused in the Express handler while building the Request object are now
  sent in a JSON API-compliant format. Before, only the status was sent or, in
  some cases, the app hung/crashed. See https://github.com/ethanresnick/json-api/issues/61

# v2.7 -> 2.8 Breaking Changes (Not Semver until 3.0)
- Babel's polyfills are no longer loaded globally, so, if you were relying on them, you'll need to re-include them yourself. See http://babeljs.io/docs/usage/polyfill/

# v2.6 -> 2.7 Breaking Changes (Not Semver until 3.0)
- Some error objects in 4xx and 5xx responses may be different, as we now expose fewer error details by default (for security reasons). See [the relevant commit](https://github.com/ethanresnick/json-api/commit/f1477c78aa58a1e7d2cb1ffc7922e0e050f4d1df) for more information.

# v2.5 -> 2.6 Breaking Changes (Not Semver until 3.0)
- In relationship objects, `self` and `related` links now properly show up under the `links` key. Closes [#36](https://github.com/ethanresnick/json-api/issues/36).

# v2.4 -> 2.5 Breaking Changes (Not Semver until 3.0)
- The `location` property on the `Response` class is now at
  `response.headers.location` instead of `response.location`.

# v2.3 -> 2.4 Breaking Changes (Not Semver until 3.0)
- Sort fields (in the `sort` query parameter) no longer need to be prefixed by
  a "+" to trigger ascending order, per JSON API 1.0.

# v2.2.11 -> v2.3 Breaking Changes (Not Semver until 3.0)
- Mongoose 4 is now required.
- The MongooseAdapter is now at a different export path:
  `require("json-api").dbAdapters.MongooseAdapter`.
  Update your references to the adapter accordingly.
- Resource type descriptions now use a `dbAdapter` property instead of `adapter`.

- The Front Controller has been replaced with an ExpressStrategy, which is
  exported at `require("json-api").httpStrategies.Express)`. The API is the
  same as for the old Front Controller, with the addition of some new options.

- The new payload's resource object format complies with JSON API 1.0, meaning
  it uses the `relationships` container, rather putting relationships under
  `links`, and uses a `data` member instead of `linkage` within relationships.

- In auto-generated documentation’s JSON, many names were dasherized or tweaked:
  - field.kind.isArray => field.kind.is-array;
  - field.kind.targetModel => target-model;
  - field.kind.targetType => field.kind.target-type

  - field.friendlyName => field.friendly-name
  - field.validation.readOnly => field.validation.read-only;
  - field.validation.allowedHtml => field.validation.allowed-html

  - field.kind.name => field.kind.base-type;
	- "Link fields" get field.kind.base-type = `"Relationship"` rather than `"Link"`
	- field.validation.oneOf => field.validation.enum;

