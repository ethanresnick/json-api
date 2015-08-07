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

