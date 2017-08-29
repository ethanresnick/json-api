import APIError from "../../types/APIError";
import Collection from "../../types/Collection";
import { DeleteQuery, Constraint } from "../../types/Query";
import { getIdQueryType } from "./query-helpers";

export default function(request, registry) {
  const type = request.type;

  if(request.aboutRelationship) {
    if(Array.isArray(request.idOrIds)) {
      throw new APIError(
        400, undefined,
        "You can only remove resources from the linkage of one resource at a time."
      );
    }
    return {
      using: type,
      method: "removeFromRelationship",
      resourceId: request.idOrIds,
      relationshipName: request.relationship,
      linkage: request.primary
    }
  }

  // Bulk delete
  const bulkDelete = !request.idOrIds;
  if(bulkDelete) {
    if(!(request.primary instanceof Collection)) {
      const title = "You must provide an array of objects to do a bulk delete.";
      throw new APIError(400, undefined, title);
    }

    if(!request.primary.resources.every((it) => typeof it.id !== "undefined")) {
      const title = "Every object provided for a bulk delete must contain a `type` and `id`.";
      throw new APIError(400, undefined, title);
    }
  }

  const [idCriteria] =
    getIdQueryType(
      bulkDelete
        ? request.primary.resources.map((it) => it.id)
        : request.idOrIds
    );

  console.log(
    new DeleteQuery({ using: type }).andWhere(<Constraint>idCriteria)
  );

  return {
    using: type,
    method: "delete",
    criteria: {
      where: {
        and: [{
          ...<Constraint>idCriteria
        }],
        or: undefined
      }
    }
  };
}
