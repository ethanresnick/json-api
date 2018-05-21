import ResourceTypeRegistry from '../ResourceTypeRegistry';
import { QueryReturning } from '../db-adapters/AdapterInterface';

import Query from '../types/Query/Query';
import CreateQuery from '../types/Query/CreateQuery';
import FindQuery from '../types/Query/FindQuery';
import DeleteQuery from '../types/Query/DeleteQuery';
import UpdateQuery from '../types/Query/UpdateQuery';
import AddToRelationshipQuery from '../types/Query/AddToRelationshipQuery';
import RemoveFromRelationshipQuery from '../types/Query/RemoveFromRelationshipQuery';

import { invalidQueryParamValue, unknownResourceType } from '../util/errors';

export default function(
  registry: ResourceTypeRegistry,
  query: Query
): Promise<QueryReturning> {
  const typeDesc = registry.type(query.type);

  // If the type in the query hasn't been registered,
  // we can't look up it's adapter to run the query, so we 404.
  if(!typeDesc) {
    throw unknownResourceType({
      detail: `${query.type} is not a known type in this API.`
    });
  }

  const finalQuery = finalizeQuery(registry, query);
  const adapter = typeDesc.dbAdapter;
  const method = (
    (finalQuery instanceof CreateQuery && adapter.create) ||
    (finalQuery instanceof FindQuery && adapter.find) ||
    (finalQuery instanceof DeleteQuery && adapter.delete) ||
    (finalQuery instanceof UpdateQuery && adapter.update) ||
    (finalQuery instanceof AddToRelationshipQuery && adapter.addToRelationship) ||
    (finalQuery instanceof RemoveFromRelationshipQuery && adapter.removeFromRelationship)
  );

  if (!method) {
    throw new Error("Unexpected query type.");
  }

  return method.call(adapter, finalQuery);
}

/**
 * Validates the query and modifies it as needed (e.g., applying the
 * max limit) to produce the query we're ultimately gonna run.
 */
function finalizeQuery(registry: ResourceTypeRegistry, query: Query) {
  // Enforce max limit if necessary (only for FindQuery's atm).
  if(!(query instanceof FindQuery)) {
    return query
  }

  // Note: type is verified to exist before calling this function.
  // tslint:disable-next-line no-non-null-assertion
  const typeDesc = registry.type(query.type)!;

  let { limit } = query;
  const { ignoreLimitMax } = query;
  const { maxPageSize } = typeDesc.pagination;

  if(typeof maxPageSize === 'number' && !ignoreLimitMax) {
    if(typeof limit === 'undefined') {
      limit = maxPageSize;
    }

    else if (limit > maxPageSize) {
      // TODO: It's possible that the limit in this query didn't come from
      // ?page[limit] at all, which would make this error misleading.
      // Consider throwing a more generic error, and then catching & replacing
      // it with the invalidQueryParamValue error only when we know that that's
      // actually the source of the query's limit.
      throw invalidQueryParamValue({
        detail: `Must use a smaller limit per page.`,
        source: { parameter: "page[limit]" }
      });
    }

    return query.withLimit(limit);
  }

  return query;
}
