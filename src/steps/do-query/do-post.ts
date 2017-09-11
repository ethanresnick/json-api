import templating = require("url-template");
import Resource from "../../types/Resource";
import AddToRelationshipQuery from '../../types/Query/AddToRelationshipQuery';

export default function(request, response, registry, query) {
  const type    = request.type;
  const adapter = registry.dbAdapter(type);

  // We're going to do an adapter.create, below, EXCEPT if we're adding to
  // an existing toMany relationship, which uses a different adapter method.
  if(query instanceof AddToRelationshipQuery) {
    return adapter.doQuery(query).then(() => {
      response.status = 204;
    });
  }

  return adapter.doQuery(query).then((created) => {
    response.primary = created;
    response.status = 201;

    // We can only generate a Location url for a single resource.
    if(created instanceof Resource) {
      const templates = registry.urlTemplates(created.type);
      const template = templates && templates.self;
      if(template) {
        const templateData = {"id": created.id, ...created.attrs};
        response.headers.location = templating.parse(template).expand(templateData);
      }
    }
  });
}
