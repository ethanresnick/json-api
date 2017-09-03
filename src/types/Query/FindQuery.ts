import WithCriteriaQuery, { WithCriteriaQueryOptions } from "./WithCriteriaQuery";
import { Sort, AndPredicate } from '../index';

export type FindQueryOptions = {
  populates?: string[],
  select?: { [typeName: string]: string[]; },
  sort?: Sort[]
  using: WithCriteriaQueryOptions['using'];
  filters?: WithCriteriaQueryOptions['filters'];
  idOrIds?: WithCriteriaQueryOptions['idOrIds'];
  limit?: WithCriteriaQueryOptions['limit'];
  offset?: WithCriteriaQueryOptions['offset'];
  singular?: WithCriteriaQueryOptions['singular']
}

export default class FindQuery extends WithCriteriaQuery {
  protected query: {
    readonly using: FindQueryOptions['using'];
    readonly select?: FindQueryOptions['select'];
    readonly sort?: FindQueryOptions['sort'];
    readonly populates?: FindQueryOptions['populates'];
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
      populates,
      select,
      sort
    };
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
