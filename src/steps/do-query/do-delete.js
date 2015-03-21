import APIError from "../../types/APIError";

export default function(requestContext, responseContext, registry) {
  let type    = requestContext.type;
  let adapter = registry.adapter(type);

  return adapter.delete(type, requestContext.idOrIds).then((resources) => {
    responseContext.status = 204;
  });
}
