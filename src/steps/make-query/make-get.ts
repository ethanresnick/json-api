import APIError from "../../types/APIError";
import { Request } from "../../types/HTTP/Request";
import FindQuery from "../../types/Query/FindQuery";

export default function(request: Request, registry, makeDoc) {
  const type = request.type;

  // Handle fields, sorts, includes and filters.
  if(!request.aboutRelationship) {
    // Attempting to paginate a single resource request
    if(request.queryParams.page && typeof request.id === 'string') {
      throw new APIError(400, undefined, "Pagination is not supported on requests for a single resource.");
    }

    const {
      include = registry.defaultIncludes(type),
      page: {offset = undefined, limit = undefined} = {},
      fields,
      sort,
      filter
    } = request.queryParams;

    return new FindQuery({
      type,
      id: request.id, // id may or may not be undefined
      populates: include,
      select: fields,
      sort,
      filters: filter,
      offset,
      limit,
      returning: ([primary, included, collectionSizeOrNull]) => ({
        document: makeDoc({
          primary,
          included,
          ...(collectionSizeOrNull != null
            ? { meta: { total: collectionSizeOrNull } }
            : {})
        })
      })
    });
  }

  // the user's asking for linkage. In this case:
  // - fields don't apply because fields only pick out members of resource
  //   objects, and here we're not returning a resource object;
  // - includes don't apply because the path names for an includes must match
  //   those in the primary data's `links` key, and this primary data doesn't
  //   have a links key.
  // - sorts don't apply beacuse that's only for resource collections.
  if(request.queryParams.page) {
    throw new APIError(
      400, undefined,
      "Pagination is not supported on requests for resource linkage."
    );
  }

  if(!request.id || !request.relationship) {
    throw new Error("An id and a relationship path must be provided on requests for resource linkage.");
  }

  return new FindQuery({
    type,
    populates: [],
    id: request.id,
    returning([resource]) {
      // 404 if the requested relationship is not a relationship path. Doing
      // it here is more accurate than using adapter.getRelationshipNames,
      // since we're allowing for paths that can optionally hold linkage,
      // which getRelationshipNames doesn't return.
      // Note: we need the type assertion because, even though we checked that
      // relationship isn't null above, it could've hypothetically been set back
      // to null before the `returning` method is called.
      const relationship = resource.relationships &&
        resource.relationships[<string>(request.relationship)];

      if(!relationship) {
        const title = "Invalid relationship name.";
        const detail = `${request.relationship} is not a valid ` +
                     `relationship name on resources of type '${type}'`;

        return {
          status: 404,
          document: makeDoc({
            primary: [new APIError(404, undefined, title, detail)]
          })
        };
      }

      return {
        document: makeDoc({ primary: relationship.linkage })
      }
    }
  });
}
