import Query, { QueryOptions } from "./Query";
import { assertKeysTruthy } from "./utils";
import Data from '../Generic/Data';
import ResourceIdentifier from '../ResourceIdentifier';

export type RemoveFromRelationshipQueryOptions = QueryOptions & {
  id: string | number,
  relationshipName: string,
  linkage: Data<ResourceIdentifier>
}

export default class RemoveFromRelationshipQuery extends Query {
  protected query: {
    type: QueryOptions['type'];
    returning: QueryOptions['returning'];
    catch: QueryOptions['catch'];
    id: RemoveFromRelationshipQueryOptions['id'];
    relationshipName: RemoveFromRelationshipQueryOptions['relationshipName'];
    linkage: RemoveFromRelationshipQueryOptions['linkage'];
  };

  constructor(opts: RemoveFromRelationshipQueryOptions) {
    const { id, relationshipName, linkage, ...baseOpts } = opts;
    super(baseOpts);
    assertKeysTruthy(["id", "relationshipName"], opts);

    this.query = {
      ...this.query,
      id: opts.id,
      relationshipName: opts.relationshipName,
      linkage: opts.linkage
    };
  }

  get id() {
    return this.query.id;
  }

  get relationshipName() {
    return this.query.relationshipName;
  }

  get linkage() {
    return this.query.linkage;
  }
}
