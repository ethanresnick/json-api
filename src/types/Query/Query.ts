export type QueryOptions = { type: string };

abstract class Query {
  protected query: { type: string };

  constructor(opts: QueryOptions) {
    if(!opts.type) {
      throw new Error("`using` option is required.");
    }

    this.query = {
      type: opts.type
    }
  }

  protected clone() {
    // We don't want to run the initialization logic/validation on clone,
    // so we just copy over the query and set up the prototype chain ourself.
    const clone = Object.create(this.constructor.prototype);
    clone.query = this.query;
    return clone;
  }

  get type() {
    return this.query.type;
  }

  forType(type: string) {
    const res = this.clone();
    res.query = { ...res.query, using: type };
    return res;
  }
}

export default Query;
