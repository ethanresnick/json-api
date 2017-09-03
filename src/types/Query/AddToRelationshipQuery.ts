import Query, { QueryOptions } from "./Query";
import { assertKeysTruthy } from "./utils";
import Linkage from '../Linkage';

export type AddToRelationshipQueryOptions = QueryOptions & {
  resourceId: string | number,
  relationshipName: string,
  linkage: Linkage
}

export default class AddToRelationshipQuery extends Query {
  protected query: {
    readonly using: QueryOptions['using'];
    readonly resourceId: AddToRelationshipQueryOptions['resourceId'];
    readonly relationshipName: AddToRelationshipQueryOptions['relationshipName'];
    readonly linkage: AddToRelationshipQueryOptions['linkage'];
  };

  constructor(opts: AddToRelationshipQueryOptions) {
    super({ using: opts.using });
    assertKeysTruthy(["resourceId", "relationshipName"], opts);

    this.query = {
      ...this.query,
      resourceId: opts.resourceId,
      relationshipName: opts.relationshipName,
      linkage: opts.linkage
    };
  }

  get resourceId() {
    return this.query.resourceId;
  }

  get relationshipName() {
    return this.query.relationshipName;
  }

  get linkage() {
    return this.query.linkage;
  }
}
