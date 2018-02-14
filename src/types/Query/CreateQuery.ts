import Query, { QueryOptions } from "./Query";
import Resource, { ResourceWithTypePath }  from '../Resource';
export { Resource, ResourceWithTypePath };
import Data from '../Generic/Data';

export type CreateQueryOptions = QueryOptions & {
  records: Data<ResourceWithTypePath>
}

export default class CreateQuery extends Query {
  protected query: {
    type: QueryOptions['type'];
    returning: QueryOptions['returning'];
    catch: QueryOptions['catch'];
    records: CreateQueryOptions['records'];
  };

  constructor({ records, ...baseOpts }: CreateQueryOptions) {
    super(baseOpts);
    this.query = {
      ...this.query,
      records: records
    };
  }

  get records() {
    return this.query.records;
  }
}
