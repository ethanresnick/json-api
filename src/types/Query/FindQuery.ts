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
    readonly returning: FindQueryOptions['returning'];
    readonly catch: FindQueryOptions['catch'];
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
