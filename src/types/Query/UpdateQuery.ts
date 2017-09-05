import Query, { QueryOptions } from "./Query";
import Resource from '../Resource';
import Collection from '../Collection';

export type UpdateQueryOptions = QueryOptions & {
  patch: Resource | Collection
}

export default class UpdateQuery extends Query {
  protected query: {
    readonly type: QueryOptions['type'];
    readonly patch: UpdateQueryOptions['patch'];
  };

  constructor(opts: UpdateQueryOptions) {
    super({ type: opts.type });

    this.query = {
      ...this.query,
      patch: opts.patch
    };
  }

  get patch() {
    return this.query.patch;
  }
}
