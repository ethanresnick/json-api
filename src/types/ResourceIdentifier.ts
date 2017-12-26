import APIError from "./APIError";

/**
 * A class for ResourceIdentifier objects.
 * Having this as a class may seem/be a bit silly, but we do it so that we can
 * do instanceof checks. Granted, we could use a Symbol for branding or something,
 * but that would be inconsistent with Resource being a class and isn't really
 * any nicer.
 */
export default class ResourceIdentifier {
  public type: string;
  public id: string;

  constructor(it: { type: string, id: string }) {
    if(!isValidLinkageObject(it)) {
      throw new APIError(400, undefined, "Invalid linkage value.");
    }

    this.type = it.type;
    this.id = it.id;
  }

  toJSON() {
    return { id: this.id, type: this.type };
  }
}

export function isValidLinkageObject(it) {
  return it && typeof it.type === "string" && typeof it.id === "string";
}
