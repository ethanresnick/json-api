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

