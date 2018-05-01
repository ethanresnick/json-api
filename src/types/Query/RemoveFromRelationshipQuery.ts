import { Result } from "../index";
import { RelationshipUpdateReturning } from '../../db-adapters/AdapterInterface';
import Query, { QueryOptions } from "./Query";
import { assertKeysTruthy } from "./utils";
import ResourceIdentifier from "../ResourceIdentifier";

export type RemoveFromRelationshipQueryOptions = QueryOptions & {
  id: string | number;
  relationshipName: string;
  linkage: ResourceIdentifier[];
  returning: (result: RelationshipUpdateReturning) => Result | Promise<Result>;
};

export default class RemoveFromRelationshipQuery extends Query {
  protected query: {
    type: QueryOptions["type"];
    catch: QueryOptions["catch"];
    returning: RemoveFromRelationshipQueryOptions["returning"];
    id: RemoveFromRelationshipQueryOptions["id"];
    relationshipName: RemoveFromRelationshipQueryOptions["relationshipName"];
    linkage: RemoveFromRelationshipQueryOptions["linkage"];
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
