# 3.0.0-alpha 
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

