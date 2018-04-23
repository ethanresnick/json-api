import WithCriteriaQuery, { WithCriteriaQueryOptions } from "./WithCriteriaQuery";
import { Sort, AndExpression } from "../index";

export type FindQueryOptions = WithCriteriaQueryOptions & {
  populates?: string[];
  select?: { [typeName: string]: string[] };
  sort?: Sort[];
};

export default class FindQuery extends WithCriteriaQuery {
  protected query: {
    type: FindQueryOptions["type"];
    returning: FindQueryOptions["returning"];
    catch: FindQueryOptions["catch"];
    select?: FindQueryOptions["select"];
    sort?: FindQueryOptions["sort"];
    populates: string[]; // never undefined in the object (it gets a default), but it can be in the option.
    criteria: {
      where: AndExpression;
      isSingular: boolean;
      limit?: FindQueryOptions["limit"];
      offset?: FindQueryOptions["offset"];
    };
  };

  constructor({ populates, select, sort, ...baseOpts }: FindQueryOptions) {
    super(baseOpts);

    this.query = {
      ...this.query,
      populates: populates || [],
      select,
      sort
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
}
