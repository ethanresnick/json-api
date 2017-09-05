import WithCriteriaQuery, { WithCriteriaQueryOptions } from "./WithCriteriaQuery";
import { AndPredicate } from "../index";
export default class DeleteQuery extends WithCriteriaQuery {
    protected query: {
        readonly type: WithCriteriaQueryOptions['type'];
        readonly criteria: {
            readonly where: AndPredicate;
            readonly singular: boolean;
            readonly limit?: WithCriteriaQueryOptions['limit'];
            readonly offset?: WithCriteriaQueryOptions['offset'];
        };
    };
    constructor(opts: WithCriteriaQueryOptions);
}
