import Query, { QueryOptions } from "./Query";
import Resource from '../Resource';
import Data from '../Data';

export type UpdateQueryOptions = QueryOptions & {
  patch: Data<Resource>
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
