import templating = require("url-template");
import Resource from "../../types/Resource";

export default function(requestContext, responseContext, registry, query) {
  const type    = requestContext.type;
  const adapter = registry.dbAdapter(type);

  // We're going to do an adapter.create, below, EXCEPT if we're adding to
  // an existing toMany relationship, which uses a different adapter method.
  if(query.method === 'addToRelationship') {
    return adapter.addToRelationship(query).then(() => {
      responseContext.status = 204;
    });
  }

  return adapter.create(query).then((created) => {
    responseContext.primary = created;
    responseContext.status = 201;

    // We can only generate a Location url for a single resource.
    if(created instanceof Resource) {
      const templates = registry.urlTemplates(created.type);
      const template = templates && templates.self;
      if(template) {
        const templateData = {"id": created.id, ...created.attrs};
        responseContext.headers.location = templating.parse(template).expand(templateData);
      }
    }
  });
}
