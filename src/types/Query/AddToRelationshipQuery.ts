import Query, { QueryOptions } from "./Query";
import { assertKeysTruthy } from "./utils";
import Linkage from '../Linkage';

export type AddToRelationshipQueryOptions = QueryOptions & {
  id: string | number,
  relationshipName: string,
  linkage: Linkage
}

export default class AddToRelationshipQuery extends Query {
  protected query: {
    readonly type: QueryOptions['type'];
    readonly returning: QueryOptions['returning'];
    readonly catch: QueryOptions['catch'];
    readonly id: AddToRelationshipQueryOptions['id'];
    readonly relationshipName: AddToRelationshipQueryOptions['relationshipName'];
    readonly linkage: AddToRelationshipQueryOptions['linkage'];
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
