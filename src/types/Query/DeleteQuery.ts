import WithCriteriaQuery, { WithCriteriaQueryOptions } from "./WithCriteriaQuery";
import { AndExpression } from "../index";

export default class DeleteQuery extends WithCriteriaQuery {
  protected query: {
    type: WithCriteriaQueryOptions["type"];
    returning: WithCriteriaQueryOptions["returning"];
    catch: WithCriteriaQueryOptions["catch"];
    criteria: {
      where: AndExpression;
      singular: boolean;
      limit?: WithCriteriaQueryOptions["limit"];
      offset?: WithCriteriaQueryOptions["offset"];
    };
  };

  constructor(opts: WithCriteriaQueryOptions) {
    super(opts);
  }
}
