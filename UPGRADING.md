# 3.0.0-beta.10 and 3.0.0-beta.11
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

