// These functions really belong in a mixin, but well-typed mixins in
// Typescript are almost impossible when declaration: true.
// See, among other things, https://github.com/Microsoft/TypeScript/issues/15001
// So, we give up on that and just use a superclass instead.
// Also, we give up on using Immutable because its typing suck so we have to
// give up basically all type safety in order to use it.
import R = require("ramda");
import {
  isId,
  FieldExpression as FieldExp,
  Identifier
} from '../../steps/pre-query/parse-query-params';
import Query, { QueryOptions } from "./Query";
import { FieldExpression, AndExpression } from "../index";

export type WithCriteriaQueryOptions = QueryOptions & {
  limit?: number;
  offset?: number;
  isSingular?: boolean;
  filters?: FieldExpression[];
  ids?: string[];
  id?: string;
};

export default class WithCriteriaQuery extends Query {
  protected query: QueryOptions & {
    criteria: {
      where: AndExpression;
      isSingular: boolean;
      offset?: number;
      limit?: number;
    };
  };

  constructor(opts: WithCriteriaQueryOptions) {
    super(opts);

    if(opts.id && opts.ids) {
      throw new Error(
        "Can't provide both the id and the ids options. Pick one."
      );
    }

    this.query = {
      ...this.query,
      criteria: {
        ...this.query.criteria,
        where: FieldExp(
          <"and">"and", // tslint:disable-line no-useless-cast
          opts.filters || []
        ),
        isSingular: opts.isSingular || opts.id !== undefined,
        limit: opts.limit,
        offset: opts.offset
      }
    };

    if(opts.ids || opts.id) {
      this.query = this.matchingIdOrIds(opts.ids || opts.id).query;
    }
  }

  /**
   * Adds a constraint to the top-level And predicate.
   * @param {FieldExpression} constraint Constraint to add.
   */
  andWhere(constraint: FieldExpression) {
    // Criteria must always be an and predicate at the root level;
    // @see matchingIdOrIds
    if(this.query.criteria.where.operator !== 'and') {
      throw new Error("Where criteria is always an and predicate");
    }

    const res = this.clone();
    res.query = {
      ...res.query,
      criteria: {
        ...res.query.criteria,
        where: {
          ...res.query.criteria.where,
          args: [
            ...res.query.criteria.where.args,
            constraint
          ]
        }
      }
    };
    return res;
  }

  /**
   * This function adds criteria to the query to have it only match an id,
   * or list of ids. Matching one id forces the query to singular mode, but
   * matching multiple ids will leave the query singular if it was already;
   * otherwise, it's plural. This function never removes existing id filters,
   * which is important for security (so a user-provided id filter query
   * parameter, e.g., can't override a hard-coded one extracted from the url).
   * Passing undefined is a noop, which is convenient if you only might have an
   * id to filter on. This function has a special role in preventing Mongo
   * injection: it always casts the ids to a string, and adds the criteria to
   * the outer-most and predicate in the where so it can't be overriden.
   * See https://thecodebarbarian.wordpress.com/2014/09/04/defending-against-query-selector-injection-attacks/
   *
   * @param {string | string[] | undefined} idOrIds [description]
   */
  matchingIdOrIds(idOrIds: string | string[] | undefined): this {
    let res;

    if(Array.isArray(idOrIds)) {
      res = this.andWhere(
        FieldExp(
          "in",
          [Identifier("id"), idOrIds.map(String)]
        )
      );
    }

    else if(typeof idOrIds === "string" && idOrIds) {
      res = this.andWhere(
        FieldExp(
          "eq",
          [Identifier("id"), String(idOrIds)]
        )
      );

      res.query = {
        ...res.query,
        criteria: {
          ...res.query.criteria,
          isSingular: true
        }
      };
    }

    else {
      res = this;
    }

    return res;
  }

  getFilters(): AndExpression {
    return R.clone(this.query.criteria.where);
  }

  /**
   * Returns a new query that has no constraints in its top-level And predicate.
   * @return {WithCriteriaQuery}
   */
  withoutFilters() {
    const res = this.clone();
    res.query = {
      ...res.query,
      criteria: {
        ...res.query.criteria,
        where: FieldExp("and", [])
      }
    };

    return res;
  }

  /**
   * @return {boolean} Whether this query is exactly matching an id or set of ids,
   *   with no other filters.
   */
  isSimpleIdQuery(): boolean {
    const filters = this.query.criteria.where.args;
    return (
      filters.length === 1 &&
      isId(filters[0].args[0]) && filters[0].args[0].value === "id" &&
      (filters[0].operator === "eq" || filters[0].operator === "in")
    );
  }

  // Still experimental
  protected removeFilter(filter: FieldExpression) {
    const res = this.clone();
    res.query.criteria.where.args =
      res.query.criteria.where.args.filter(it => !R.equals(it, filter));

    return res;
  }

  get offset() {
    return this.query.criteria.offset;
  }

  get limit() {
    return this.query.criteria.limit;
  }

  get isSingular() {
    return this.query.criteria.isSingular;
  }

  withLimit(limit: number | undefined) {
    const res = this.clone();
    res.query.criteria.limit = limit;
    return res;
  }

}
