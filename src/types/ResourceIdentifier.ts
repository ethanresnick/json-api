import APIError from "./APIError";

export type ResourceIdentifierJSON = { type: string; id: string };

/**
 * A class for ResourceIdentifier objects.
 * Having this as a class may seem/be a bit silly, but we do it so that we can
 * do instanceof checks and validation on construction. Granted, we could use
 * a Symbol for branding or something, but that would be inconsistent with
 * Resource being a class and isn't really any nicer.
 */
export default class ResourceIdentifier {
  constructor(public type: string, public id: string) {}

  toJSON() {
    return { id: this.id, type: this.type };
  }

  static fromJSON(it: ResourceIdentifierJSON) {
    if(!isValidLinkageObject(it)) {
      throw new APIError(400, undefined, "Invalid linkage value.");
    }

    const Constructor = this || ResourceIdentifier; // in case `this` isn't bound.
    return new Constructor(it.type, it.id);
  }
}

export function isValidLinkageObject(it: any): it is ResourceIdentifierJSON {
  return it && typeof it.type === "string" && typeof it.id === "string";
}
