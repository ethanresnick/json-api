import ResourceIdentifier from './ResourceIdentifier';
import { DataWithLinksArgs } from "./index";
import MaybeDataWithLinks from "./MaybeDataWithLinks";

/**
 * Used in rare cases where the primary data of a Document is resource identifier
 * objects, and yet those aren't actually part of a relationship (and so have no
 * owner). E.g., resource identifiers in bulk deletion requests.
 */
export default class ResourceIdentifierSet extends MaybeDataWithLinks<ResourceIdentifier> {
  toJSON() {
    return this.unwrapWith((it) => it.toJSON(), {});
  }

  static of(it: DataWithLinksArgs<ResourceIdentifier>) {
    return new this(it);
  }
}
