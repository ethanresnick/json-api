import APIError from "../../types/APIError";

export default function(requestContext, responseContext, registry) {
  let type    = requestContext.type;
  let adapter = registry.adapter(type);

  return adapter.create(type, requestContext.primary).then((resources) => {
    responseContext.primary = resources;
  });
}
