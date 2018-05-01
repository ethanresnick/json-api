import Query, { QueryOptions } from "./Query";
import { UpdateReturning } from '../../db-adapters/AdapterInterface';
import Resource, { ResourceWithId, ResourceWithTypePath } from "../Resource";
export { Resource, ResourceWithTypePath, ResourceWithId };
import { Result } from '../index';
import Data from "../Generic/Data";

export type UpdateQueryOptions = QueryOptions & {
  patch: Data<ResourceWithId & ResourceWithTypePath>;
  returning: (result: UpdateReturning) => Result | Promise<Result>;
};

export default class UpdateQuery extends Query {
  protected query: {
    type: QueryOptions["type"];
    catch: QueryOptions["catch"];
    returning: UpdateQueryOptions["returning"];
    patch: UpdateQueryOptions["patch"];
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
