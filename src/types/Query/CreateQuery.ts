import Query, { QueryOptions } from "./Query";
import Resource from '../Resource';
import Collection from '../Collection';

export type CreateQueryOptions = QueryOptions & {
  records:  Resource | Collection
}

export default class CreateQuery extends Query {
  protected query: {
    readonly type: QueryOptions['type'];
    readonly records: CreateQueryOptions['records'];
  };

  constructor(opts: CreateQueryOptions) {
    super({ type: opts.type });
    this.query = {
      ...this.query,
      records: opts.records
    };
  }

  get records() {
    return this.query.records;
  }
}
