import WithCriteriaQuery, { WithCriteriaQueryOptions } from "./WithCriteriaQuery";
import { Sort, AndPredicate } from '../index';

export type FindQueryOptions = WithCriteriaQueryOptions & {
  populates?: string[],
  select?: { [typeName: string]: string[]; },
  sort?: Sort[]
}

export default class FindQuery extends WithCriteriaQuery {
  protected query: {
    readonly type: FindQueryOptions['type'];
    readonly select?: FindQueryOptions['select'];
    readonly sort?: FindQueryOptions['sort'];
    readonly populates: FindQueryOptions['populates'];
    readonly criteria: {
      readonly where: AndPredicate;
      readonly singular: boolean;
      readonly limit?: FindQueryOptions['limit'];
      readonly offset?: FindQueryOptions['offset'];
    }
  };

  constructor(opts: FindQueryOptions) {
    const { populates, select, sort, ...baseOpts } = opts;
    super(baseOpts);

    this.query = {
      ...this.query,
      populates: populates || [],
      select,
      sort
    };
  }

  populate(paths) {
    const res = this.clone();
    res.query.populates = res.query.populates.concat(paths);
    return res;
  }

  depopulate(paths) {
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
