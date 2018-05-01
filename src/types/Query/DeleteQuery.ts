import WithCriteriaQuery, { WithCriteriaQueryOptions } from "./WithCriteriaQuery";
import { DeletionReturning } from '../../db-adapters/AdapterInterface';
import { AndExpression, Result } from "../index";

export type DeleteQueryOptions = WithCriteriaQueryOptions & {
  returning: (result: DeletionReturning) => Result | Promise<Result>;
};

export default class DeleteQuery extends WithCriteriaQuery {
  protected query: {
    type: WithCriteriaQueryOptions["type"];
    catch: WithCriteriaQueryOptions["catch"];
    returning: DeleteQueryOptions["returning"];
    criteria: {
      where: AndExpression;
      isSingular: boolean;
      limit?: WithCriteriaQueryOptions["limit"];
      offset?: WithCriteriaQueryOptions["offset"];
    };
  };

  constructor(opts: WithCriteriaQueryOptions) {
    super(opts);
  }
}
