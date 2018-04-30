import * as Errors from '../util/errors';

export type ResourceIdentifierJSON = { type: string; id: string };

/**
 * A class for ResourceIdentifier objects.
 * Having this as a class may seem/be a bit silly, but we do it so that we can
 * do instanceof checks and validation on construction. Granted, we could use
 * a Symbol for branding or something, but that would be inconsistent with
 * Resource being a class and isn't really any nicer.
 */
export default class ResourceIdentifier {
  public typePath: string[] | undefined;
  public adapterExtra: any;

  constructor(public type: string, public id: string) {}

  /**
   * Based on its meaning in the Resource class, the typesList would,
   * conceptually, refer to a provisional, user-provided version of the
   * typePath. However, in practice, users never provide any subtype info for
   * resource identifier objects, so typesList doesn't really make sense here.
   * Or, depending on how you look at it, it should always be undefined. We use
   * the latter strategy here so we can easily make functions that are
   * polymorphic on Resources and ResourceIdentifiers.
   */
  get typesList() {
    return undefined;
  }

  toJSON() {
    return { id: this.id, type: this.type };
  }

  static fromJSON(it: ResourceIdentifierJSON) {
    if(!isValidLinkageObject(it)) {
      throw Errors.invalidLinkageStructure();
    }

    const Constructor = this || ResourceIdentifier; // in case `this` isn't bound.
    return new Constructor(it.type, it.id);
  }
}

export function isValidLinkageObject(it: any): it is ResourceIdentifierJSON {
  return it && typeof it.type === "string" && typeof it.id === "string";
}
