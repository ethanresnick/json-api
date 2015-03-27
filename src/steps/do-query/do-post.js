import APIError from "../../types/APIError";
import Resource from "../../types/Resource";
import templating from "url-template";

export default function(requestContext, responseContext, registry) {
  let primary = requestContext.primary;
  let type    = requestContext.type;
  let adapter = registry.adapter(type);

  return adapter.create(type, primary).then((created) => {
    responseContext.primary = created;
    responseContext.status = 201;

    // We can only generate a Location url for a single resource.
    if(created instanceof Resource) {
      let templates = registry.urlTemplates(created.type);
      let template = templates && templates.self;
      if(template) {
        let templateData = Object.assign({"id": created.id}, created.attrs);
        responseContext.location = templating.parse(template).expand(templateData);
      }
    }
  });
}
