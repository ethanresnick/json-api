# v2.2.11 -> v2.3 (Not Semver)
## Breaking Changes
- The MongooseAdapter is now at a different export path (require(“json-api”).dbAdapters.MongooseAdapter) Update your reference to the MongooseAdapter.
- Update your resource descriptions to have a `dbAdapter` property instead of `adapter`.
- New payload uses the `relationships` container, rather putting relationships under `links`, and uses a `data` member instead of `linkage` within relationships.
- In auto-generated documentation’s JSON, many names were dasherized or tweaked:
	- field.kind.name => field.kind.base-type; field.kind.isArray => field.kind.is-array; field.kind.targetModel => target-model; field.kind.targetType => field.kind.target-type
	- “link fields” get field.kind.base-type = “Relationship” rather than “Link”
	- field.friendlyName => field.friendly-name
	- field.validation.oneOf => field.validation.enum; 
	- field.validation.readOnly => field.validation.read-only; field.validation.allowedHtml => field.validation.allowed-html