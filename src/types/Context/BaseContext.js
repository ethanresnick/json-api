/**
 * The BaseContext class handles the core logic of applying the initial values
 * provided and making sure that all Context objects get sealed post creation.
 */
export default class BaseContext {
  constructor(initialValues) {
    // Use initial values where possible.
    if(Object.prototype.toString.call(initialValues).slice(8, -1) === "Object") {
      for(let key in this) {
        if(this.hasOwnProperty(key) && initialValues[key] !== undefined) {
          this[key] = initialValues[key];
        }
      }
    }

    // Object.seal prevents any other properties from being added to Context
    // objects. Every property a context needs should be specified/documented here.
    return Object.seal(this);
  }
}
