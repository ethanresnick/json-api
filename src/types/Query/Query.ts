export type QueryOptions = { using: string };

abstract class Query {
  protected query: { using: string };

  constructor(opts: QueryOptions) {
    if(!opts.using) {
      throw new Error("`using` option is required.");
    }

    this.query = {
      using: opts.using
    }
  }

  protected clone() {
    // We don't want to run the initialization logic/validation on clone,
    // so we just copy over the query and set up the prototype chain ourself.
    const clone = Object.create(this.constructor.prototype);
    clone.query = this.query;
    return clone;
  }

  get using() {
    return this.query.using;
  }
}

export default Query;
