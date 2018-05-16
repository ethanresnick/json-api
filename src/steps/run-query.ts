import ResourceTypeRegistry from '../ResourceTypeRegistry';
import { QueryReturning } from '../db-adapters/AdapterInterface';

import Query from '../types/Query/Query';
import CreateQuery from '../types/Query/CreateQuery';
import FindQuery from '../types/Query/FindQuery';
import DeleteQuery from '../types/Query/DeleteQuery';
import UpdateQuery from '../types/Query/UpdateQuery';
import AddToRelationshipQuery from '../types/Query/AddToRelationshipQuery';
import RemoveFromRelationshipQuery from '../types/Query/RemoveFromRelationshipQuery';

import { unknownResourceType } from '../util/errors';

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
 * Validates the query and modifies it as needed to produce the query
 * we're ultimately gonna run.
 */
function finalizeQuery(registry: ResourceTypeRegistry, query: Query) {
  return query;
}
