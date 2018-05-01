import { Result } from "../index";
import { RelationshipUpdateReturning } from '../../db-adapters/AdapterInterface';
import Query, { QueryOptions } from "./Query";
import { assertKeysTruthy } from "./utils";
import ResourceIdentifier from "../ResourceIdentifier";

export type AddToRelationshipQueryOptions = QueryOptions & {
  id: string | number;
  relationshipName: string;
  linkage: ResourceIdentifier[];
  returning: (result: RelationshipUpdateReturning) => Result | Promise<Result>;
};

export default class AddToRelationshipQuery extends Query {
  protected query: {
    type: QueryOptions["type"];
    catch: QueryOptions["catch"];
    returning: AddToRelationshipQueryOptions["returning"];
    id: AddToRelationshipQueryOptions["id"];
    relationshipName: AddToRelationshipQueryOptions["relationshipName"];
    linkage: AddToRelationshipQueryOptions["linkage"];
  };

  constructor(opts: AddToRelationshipQueryOptions) {
    const { id, relationshipName, linkage, ...baseOpts } = opts;
    super(baseOpts);
    assertKeysTruthy(["id", "relationshipName"], opts);

    this.query = {
      ...this.query,
      id,
      relationshipName,
      linkage
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
