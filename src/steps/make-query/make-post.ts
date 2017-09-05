import APIError from "../../types/APIError";
import Linkage from "../../types/Linkage";
import {forEachResources} from "../../util/type-handling";
import CreateQuery from "../../types/Query/CreateQuery";
import AddToRelationshipQuery from '../../types/Query/AddToRelationshipQuery';

export default function(request, registry) {
  const primary = request.primary;
  const type    = request.type;

  // We're going to do an adapter.create, below, EXCEPT if we're adding to
  // an existing toMany relationship, which uses a different adapter method.
  if(primary instanceof Linkage) {
    if(!Array.isArray(primary.value)) {
      throw new APIError(
        400,
        undefined,
        "To add to a to-many relationship, you must POST an array of linkage objects."
      );
    }

    return new AddToRelationshipQuery({
      type,
      id: request.idOrIds,
      relationshipName: request.relationship,
      linkage: primary
    });
  }

  else {
    const noClientIds = "Client-generated ids are not supported.";
    forEachResources(primary, (it) => {
      if(it.id) throw new APIError(403, undefined, noClientIds);
    });

    return new CreateQuery({
      type,
      records: primary
    });
  }
}
