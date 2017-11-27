import Query, { QueryOptions } from "./Query";
import Resource from '../Resource';
import Collection from '../Collection';

export type UpdateQueryOptions = QueryOptions & {
  patch: Resource | Collection
}

export default class UpdateQuery extends Query {
  protected query: {
    type: QueryOptions['type'];
    returning: QueryOptions['returning'];
    catch: QueryOptions['catch'];
    patch: UpdateQueryOptions['patch'];
  };

  constructor({ patch, ...baseOpts }: UpdateQueryOptions) {
    super(baseOpts);

    this.query = {
      ...this.query,
      patch
    };
  }

  get patch() {
    return this.query.patch;
  }
}
