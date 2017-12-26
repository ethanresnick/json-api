import { DataOf, Reducer, PredicateFn, Mapper, AsyncMapper } from "./index";

/**
 * This type represents a set of values (stored in an array) along with an
 * `isSingular` flag indicating whether the set is "conceptually singular"
 * (i.e., will always have a cardinality of 0 or 1). For example, "The latest
 * post" is conceptually singular, but "Posts by John Doe" isn't, even though
 * both could happen to be have only 0 or 1 items.
 *
 * This type is basically an instance of the Writer monad. The computed data is
 * the main data array (which is the List monad), while the isSingular metadata
 * constitutes the monoid. Its mzero is true and `mappend` is defined as &&.
 *
 * This type is very convenient for repersenting values that go in JSON:API's
 * `data` key, whether as primary data or in a relationship. Such values are
 * rendered differently in JSON:API when they're conceptually singular -- namely,
 * the empty set gets rendered as null rather than [], and a single item set is
 * rendered as list[0] rather than as an array -- but we don't want to have to
 * care about that final rendering as we're working with the values. This type
 * gives us a map/flatMap that doesn't need to think about cardinality, while
 * then letting us output the value appropriately with the unwrap() method.
 *
 * The name of this type, though arguably a little too generic, was chosen as
 * a reference to JSON:API's use of the key `data` and because it's short.
 *
 * Note: because this is just the list + writer monad, its polymorphic in all T.
 * However, in practice, we mostly use it for resources and resource identifier
 * objects (which are all JSON:API `data` can hold). Still, the polymorphism
 * comes in very handy. For example, Mongoose also returns (null | doc) when
 * the result is conceptually singular (i.e., findOne queries), but a doc[] when
 * it's conceptually plural, and the polymorphism lets us use Data for that too.
 * Also, we might convert the items in a Data to plain JS objects in prepration
 * for output, again leveraging the nice uniform map/bind interface.
 *
 * The one complication is that we need our mapping/binding functions to be
 * able to return promises if we're going to implement beforeRender/beforeSave
 * transforms on top of this abstraction, which is the point. That creates a
 * problem, though, because we have to await the promise inside this abstraction,
 * as the abstraction needs to see the final values to do the join (as part of
 * flatMap), etc. One option was to make the internal data always be a promise,
 * which would've been "purer" because we could've continued to follow all the
 * monad laws with no extra functions/rough edges, but it would've lead to
 * allocating a ton of unnecessary promises throughout the codebase, since this
 * is used everywhere. So, instead, I made separate promise-aware mapAsync and
 * flatMapAsnyc functions that know how to await the transformed results and
 * return a promise for a new Data<T>.
 *
 * TODO: Make this a subclass of array, maybe leveraging Symbol.species?
 * That would give us reduce/every/forEach etc for free...
 */
export type INTERNAL_DONT_USE<T> = {
  data: T[],
  isSingular: boolean
};

export default class Data<T> {
  protected constructor(private value: INTERNAL_DONT_USE<T>) { }

  /**
   * Takes in the new Data<T>s and joins their list items (with concat)
   * while appending the isSingular to produce the final Data<T>.
   *
   * @param {Data<T>[]} newDatas The result of running the bind function
   *   on each element in our internal list to get a new Data<T>.
   */
  private flatMapHelper<U>(newDatas: Data<U>[]) {
    const newValues = newDatas.map(it => it.value);
    const Constructor = this.constructor as typeof Data;

    return new Constructor<U>(
      newValues.reduce((acc, it) => ({
        data: acc.data.concat(it.data),
        isSingular: acc.isSingular && it.isSingular
      }), {
        data: [],
        isSingular: this.value.isSingular
      })
    );
  }

  flatMap<U>(fn: (it: T) => Data<U>) {
    return this.flatMapHelper(this.value.data.map(fn));
  }

  async flatMapAsync<U>(fn: (it: T) => Data<U> | Promise<Data<U>>) {
    return this.flatMapHelper(await Promise.all(this.value.data.map(fn)));
  }

  /**
   * Takes the result of running the mapping function over each item and
   * returns the new Data<T> that's the final result of map.
   *
   * Note: using the new values but returning isSingular as is
   * is provably equivalent to `this.flatMap(R.compose(Data.pure, fn))`.
   * We do the below, though, so that we don't have to create (with Data.pure)
   * a bunch of neutral/identity elements for the the isSingular value
   * (i.e., true) that will have no effect when we do the join.
   *
   * @param {T[]} newValues The result of running the mapping function
   *   on each element in our internal list to get a new T.
   */
  private mapHelper<U>(newValues: U[]) {
    const Constructor = this.constructor as typeof Data;

    return new Constructor<U>({
      data: newValues,
      isSingular: this.value.isSingular
    });
  }

  map<U>(fn: Mapper<T, U>) {
    return this.mapHelper(this.value.data.map(fn));
  }

  async mapAsync<U>(fn: AsyncMapper<T, U>) {
    return this.mapHelper(await Promise.all(this.value.data.map(fn)));
  }

  every(fn: PredicateFn<T>) {
    return this.value.data.every(fn);
  }

  some(fn: PredicateFn<T>) {
    return this.value.data.some(fn);
  }

  forEach(fn: (it: T) => void) {
    this.value.data.forEach(fn);
    return this; // for chaining
  }

  reduce(fn: Reducer<T, any>, initialValue?: any) {
    return this.value.data.reduce(fn, initialValue);
  }

  filter(fn: PredicateFn<T>) {
    const Constructor = this.constructor as typeof Data;

    return new Constructor<T>({
      data: this.value.data.filter(fn),
      isSingular: this.value.isSingular
    });
  }

  /**
   * A function that applies the singular/non-singular logic
   * from json api to the data for export.
   */
  unwrap() {
    if(this.value.isSingular) {
      return this.value.data.length === 0 ? null : this.value.data[0];
    }

    return this.value.data;
  }

  get isSingular() {
    return this.value.isSingular;
  }

  get values() {
    return [...this.value.data];
  }

  get size() {
    return this.value.data.length;
  }

  /**
   * A function that lifts a value parsed from JSON:API JSON into the monad.
   */
  static fromJSON<T>(data: DataOf<T>): Data<T> {
    return data === null
      ? this.empty
      : Array.isArray(data) ? this.of(data) : this.pure(data);
  }

  /**
   * A value you can return from your flatMap callback to remove an item.
   * This isn't technically a zero for the monad because, if you have an
   * instance where isSingular is false and you flatMap that using
   * (it => Data.empty) the resulting monad still has isSingular as false.
   * If it were a true zero, binding to toMzero would give you isSingular true.
   * That doesn't happen though because the monoidal part of the metadata
   * is appended to in flatMap not reset.
   * @type {[type]}
   */
  static empty =
    new Data<any>({ data: [], isSingular: true });

  /**
   * Helper for initializing an instance that's not singular.
   */
  static of<U>(data: U[]) {
    const Ctor = this || Data; // fallback if this is unbound.

    return new Ctor<U>({
      data: data,
      isSingular: false
    });
  }

  /**
   * Monad's `return` function. Creates a singular instance.
   */
  static pure<U>(data: U) {
    const Ctor = this || Data; // fallback if this is unbound.

    return new Ctor<U>({
      data: [data],
      isSingular: true
    });
  }
}
