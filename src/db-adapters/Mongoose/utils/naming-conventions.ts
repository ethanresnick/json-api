import pluralize = require("pluralize");

/**
 * Takes a json-api type name, assumed to be using the dasherized, pluralized
 * conventions that are recommended for the json-api `type` key, and returns
 * a singularized, PascalCase version of that name, per the naming conventions
 * of Mongoose models.
 *
 * @param {string} typeName The json-api type string.
 * @param {(string) => string} singularizer A function that singularizes its argument.
 */
export function getModelName(
  typeName: string,
  singularizer: typeof pluralize.singular = pluralize.singular.bind(pluralize)
) {
  const words = typeName.split("-");
  words[words.length - 1] = singularizer(words[words.length - 1]);
  return words.map((it) => it.charAt(0).toUpperCase() + it.slice(1)).join("");
}

/**
 * Takes a mongoose model name and returns the corresponding name according to
 * the dasherized, pluralized conventions used by the json-api `type` key.
 *
 * @param {string} modelName The name of a model, in Mongoose's PascalCase format.
 * @param {(string) => string} pluralizer A function that pluralizes its argument.
 */
export function getTypeName(
  modelName: string,
  pluralizer: typeof pluralize.plural = pluralize.plural.bind(pluralize)
) {
  return pluralizer(modelName.replace(/([A-Z])/g, "\-$1").slice(1).toLowerCase());
}
