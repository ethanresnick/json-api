import { Result } from '../index';
export type QueryOptions = {
  type: string,
  returning: (result: any) => Result,
  catch?: (err: any) => Result
};

abstract class Query {
  protected query: {
    type: QueryOptions['type'],
    returning: QueryOptions['returning'],
    catch?: QueryOptions['catch']
  };

  constructor(opts: QueryOptions) {
    if(!opts.type) {
      throw new Error("`using` option is required.");
    }

    this.query = {
      type: opts.type,
      returning: opts.returning,
      catch: opts.catch
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

  get returning() {
    return this.query.returning;
  }

  get catch() {
    return this.query.catch;
  }

  resultsIn(success?: QueryOptions['returning'], fail?: QueryOptions['catch']) {
    const res = this.clone();
    if(success) {
      res.query.returning = success;
    }

    if(fail) {
      res.query.catch = fail;
    }

    return res;
  }

  forType(type: string) {
    const res = this.clone();
    res.query = { ...res.query, using: type };
    return res;
  }
}

export default Query;
