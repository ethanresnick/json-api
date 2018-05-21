import WithCriteriaQuery, { WithCriteriaQueryOptions } from "./WithCriteriaQuery";
import { FindReturning } from '../../db-adapters/AdapterInterface';
import { Sort, AndExpression, Result } from "../index";

export type FindQueryOptions = WithCriteriaQueryOptions & {
  populates?: string[];
  select?: { [typeName: string]: string[] };
  sort?: Sort[];
  returning(result: FindReturning): Result | Promise<Result>;
  ignoreLimitMax?: boolean;
};

export default class FindQuery extends WithCriteriaQuery {
  protected query: {
    type: FindQueryOptions["type"];
    catch: FindQueryOptions["catch"];
    returning: FindQueryOptions["returning"];
    select?: FindQueryOptions["select"];
    sort?: FindQueryOptions["sort"];
    populates: string[]; // never undefined in the object (it gets a default), but it can be in the option.
    criteria: {
      where: AndExpression;
      isSingular: boolean;
      limit?: FindQueryOptions["limit"];
      offset?: FindQueryOptions["offset"];
    };
    ignoreLimitMax: boolean;
  };

  constructor({
    populates,
    select,
    sort,
    ignoreLimitMax,
    ...baseOpts
  }: FindQueryOptions) {
    super(baseOpts);

    this.query = {
      ...this.query,
      populates: populates || [],
      select,
      sort,
      ignoreLimitMax: ignoreLimitMax || false
    };
  }

  onlyPopulates(paths: string[]) {
    const res = this.clone();
    res.query.populates = paths.slice();
    return res;
  }

  withPopulates(paths: string[]) {
    const res = this.clone();
    res.query.populates = res.query.populates.concat(paths);
    return res;
  }

  withoutPopulates(paths: string[]) {
    const res = this.clone();
    res.query.populates = res.query.populates.filter(it => paths.indexOf(it) === -1);
    return res;
  }

  get populates() {
    return this.query.populates;
  }

  get select() {
    return this.query.select;
  }

  get sort() {
    return this.query.sort;
  }

  get ignoreLimitMax() {
    return this.query.ignoreLimitMax;
  }

  withMaxLimit() {
    const res = this.clone();
    res.query.ignoreLimitMax = false;
    return res;
  }


  withoutMaxLimit() {
    const res = this.clone();
    res.query.ignoreLimitMax = true;
    return res;
  }
}
