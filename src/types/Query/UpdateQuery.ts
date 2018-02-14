import Query, { QueryOptions } from "./Query";
import Resource, { ResourceWithId, ResourceWithTypePath } from '../Resource';
export { Resource, ResourceWithTypePath, ResourceWithId };
import Data from '../Generic/Data';

export type UpdateQueryOptions = QueryOptions & {
  patch: Data<ResourceWithId & ResourceWithTypePath>
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
