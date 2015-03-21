import Collection from "../../types/Collection"
import Q from "q"

export default function(registry, req, requestContext, responseContext) {
  return Q.Promise(function(resolve, reject) {
    let idMapper = registry.labelToIdOrIds(type);
    let type      = requestContext.type;
    let adapter   = registry.adapter(type);
    let model     = adapter.getModel(adapter.constructor.getModelName(type));

    if(typeof idMapper === "function") {
      Q(idMapper(requestContext.idOrIds, model, req)).then((newId) => {
        let newIdIsEmptyArray = (Array.isArray(newId) && newId.length === 0);

        requestContext.idOrIds = newId;

        if(newId === null || newId === undefined || newIdIsEmptyArray) {
          responseContext.primary = (newId) ? new Collection() : null;
        }

        resolve();
      });
    }

    else {
      resolve();
    }
  });
}



