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
    readonly id: AddToRelationshipQueryOptions['id'];
    readonly relationshipName: AddToRelationshipQueryOptions['relationshipName'];
    readonly linkage: AddToRelationshipQueryOptions['linkage'];
  };

  constructor(opts: AddToRelationshipQueryOptions) {
    super({ type: opts.type });
    assertKeysTruthy(["resourceId", "relationshipName"], opts);

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
