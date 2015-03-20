import APIError from "../../types/APIError";

export default function(requestContext, responseContext, registry) {
  let type    = requestContext.type;
  let adapter = registry.adapter(type);
  let fields, sorts, includes, filters;

  // Handle fields, sorts, includes and filters.
  if(!requestContext.aboutLinkObject) {
    fields = parseFields(requestContext.queryParams.fields);
    sorts  = parseSorts(requestContext.queryParams.sort);
    includes = parseCommaSeparatedParam(requestContext.queryParams.include);
    if(!includes) {
      includes = registry.defaultIncludes(type);
    }
  }

  return adapter
    .find(type, requestContext.idOrIds, fields, sorts, filters, includes)
    .then((resources) => {
      [responseContext.primary, responseContext.included] = resources;
    });
}

function parseSorts(sortParam) {
  if(!sortParam) {
    return undefined;
  }
  else {
    let sorts = parseCommaSeparatedParam(sortParam);
    let invalidSorts = sorts.filter((it) => ["+", "-"].indexOf(it.charAt(0)) === -1);
    if(invalidSorts.length) {
      throw new APIError(
        400, null,
        "All sort parameters must start with a + or a -.",
        `The following sort parameters were invalid: $(invalidSorts.join(', ')).`
      );
    }
    return sorts;
  }
}

function parseFields(fieldsParam) {
  let fields;
  if(typeof fieldsParam === "object") {
    fields = {};
    let isField = (it) => ["id", "type", "meta"].indexOf(it) === -1;

    for(let type in fieldsParam) {
      let provided = parseCommaSeparatedParam(fieldsParam[type]);
      //this check handles query strings like fields[people]=
      if(provided) {
        fields[type] = provided.filter(isField);
      }
    }
  }
  return fields;
}

function parseCommaSeparatedParam(it) {
  return it ? it.split(",").map(decodeURIComponent) : undefined;
}
