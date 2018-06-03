const reduce = Function.bind.call(Function.call, Array.prototype.reduce); // tslint:disable-line:no-unbound-method
const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable); // tslint:disable-line:no-unbound-method
const concat = Function.bind.call(Function.call, Array.prototype.concat); // tslint:disable-line:no-unbound-method
const keys = Reflect.ownKeys;

/**
 * A polyfill for ES2017's Object.entries
 * @param {Object} o The object whose entries to get.
 * @returns An array of [k, v] arrays for all the own, enumerable properties
 *   of the object (symbols included).
 */
export function entries<T>(o: { [s: string]: T }): [string, T][] {
  return reduce(keys(o), (e: [string, any][], k: PropertyKey) => {
    return concat(e, typeof k === 'string' && isEnumerable(o, k) ? [[k, o[k]]] : [])
  }, []);
}

/**
 * A polyfill for ES2017's Object.values
 * @returns An array of the values assigned to the own, enumerable properties
 *   of the object (symbols included).
 */
export function values<T>(o: { [key: string]: T }): T[] {
  return reduce(keys(o), (v: any[], k: PropertyKey) => {
    return concat(v, typeof k === 'string' && isEnumerable(o, k) ? [o[k]] : [])
  }, []);
}
