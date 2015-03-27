import Collection from "../../types/Collection"
import Q from "q"

export default function(type, labelOrId, registry, frameworkReq) {
  return Q.Promise(function(resolve, reject) {
    let adapter      = registry.adapter(type);
    let model        = adapter.getModel(adapter.constructor.getModelName(type));
    let labelMappers = registry.labelMappers(type);
    let labelMapper  = labelMappers && labelMappers[labelOrId];

    // reolve with the mapped label
    if(typeof labelMapper === "function") {
      Q(idMapper(model, frameworkReq)).then(resolve);
    }

    // or, if we couldn't find a label mapper, that means
    // we were given an id, so we just resolve with that id.
    else {
      resolve(labelOrId);
    }
  });
}



