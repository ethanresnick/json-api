import Collection from "../../types/Collection"
import Q from "q"

export default function(registry, frameworkReq, requestContext, responseContext) {
  return Q.Promise(function(resolve, reject) {
    if(!requestContext.allowLabel) {
      resolve();
    }
    else {
      let type      = requestContext.type;
      let adapter   = registry.adapter(type);
      let model     = adapter.getModel(adapter.constructor.getModelName(type));
      let idMappers = registry.labelMappers(type);
      let idMapper  = idMappers && idMappers[requestContext.idOrIds];

      if(typeof idMapper === "function") {
        Q(idMapper(model, frameworkReq)).then((newId) => {
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
    }
  });
}



