import Immutable = require("immutable");
import { pseudoTopSort } from "./util/misc";
import { Maybe } from "./util/type-handling";
import { TransformFn } from "./steps/apply-transform";
import { AdapterInstance } from "./db-adapters/AdapterInterface";

/**
 * Global defaults for all resource descriptions, to be merged into the
 * defaults provided to the ResourceTypeRegistry, which are in turn merged
 * into the values provided in each resource type description.
 */
const globalResourceDefaults = Immutable.fromJS({
  /*behaviors: {
    dasherizeOutput: { enabled: true }
  }*/
});

export type URLTemplates = {
  [type: string]: URLTemplatesForType;
}

export type URLTemplatesForType = { [linkName: string]: string };

export type ResourceTypeInfo = {
  fields?: {[fieldName: string]: any}
  example?: string,
  description?: string
}

export type ResourceTypeDescription = {
  dbAdapter?: AdapterInstance<any>,
  info?: ResourceTypeInfo,
  defaultIncludes?: string[],
  parentType?: string,
  urlTemplates?: URLTemplatesForType,
  beforeSave?: TransformFn,
  beforeRender?: TransformFn,
  behaviors?: object
}

export type ResourceTypeDescriptions = {
  [typeName: string]: ResourceTypeDescription
}

/**
 * To fulfill a JSON API request, you often need to know about all the resources
 * types in the system--not just the type that is the primary target of the
 * request. For example, if the request is for a User (or Users), you might need
 * to include related Projects, so the code handling the users request needs
 * access to the Project resource's beforeSave and beforeRender methods; its
 * url templates; etc. So we handle this by introducing a ResourceTypeRegistry
 * that the Controller can have access to. Each resource type is registered by
 * its JSON API type and has a number of properties defining it.
 */
export default class ResourceTypeRegistry {
  private _types: {
    [typeName: string]: Immutable.Map<string, any> | undefined
  };

  constructor(
    typeDescs: ResourceTypeDescriptions = Object.create(null),
    descDefaults: object|Immutable.Map<string, any> = {}
  ) {
    this._types = {};

    const finalDefaults =
      <Immutable.Map<string, any>>globalResourceDefaults.mergeDeep(descDefaults);

    // Sort the types so we can register them in an order that respects their
    // parentType. First, we pre-process the typeDescriptions to create edges
    // pointing to each node's children (rather than the links we have by
    // default, which point to the parent). Then we do an abridged topological
    // sort that works in this case. Below, nodes is a list of type names.
    // Roots are nodes with no parents. Edges is a map, with each key being the
    // name of a starting node A, and the value being a set of node names for
    // which there is an edge from A to that node.
    const nodes: string[] = [], roots: string[] = [], edges = {};

    for(const typeName in typeDescs) {
      const nodeParentType = typeDescs[typeName].parentType;
      nodes.push(typeName);

      if(nodeParentType) {
        edges[nodeParentType] = edges[nodeParentType] || {};
        edges[nodeParentType][typeName] = true;
      }
      else {
        roots.push(typeName);
      }
    }

    const typeRegistrationOrder = pseudoTopSort(nodes, edges, roots);

    // register the types, in order
    typeRegistrationOrder.forEach((typeName) => {
      const parentType = typeDescs[typeName].parentType;

      // defaultIncludes need to be made into an object if they came as an array.
      // TODO: Remove support for array format before v3. It's inconsistent.
      const thisDescriptionRaw = Immutable.fromJS(typeDescs[typeName]);
      const thisDescriptionMerged = finalDefaults.mergeDeep(thisDescriptionRaw);

      this._types[typeName] = (parentType)
        // If we have a parentType, we merge in all the parent's fields
        ? (<Immutable.Map<string, any>>this._types[parentType])
            .mergeDeep(thisDescriptionRaw)
            // if we had properties we didn't want to merge, we could reset
            // them here, like: .set("prop", thisDescriptionRaw.get("prop"))

        // If we don't have a parentType, just register
        // the description merged with the universal defaults
        : thisDescriptionMerged;
    });
  }

  type(typeName) {
    return Maybe(this._types[typeName])
      .map(it => <ResourceTypeDescription>it.toJS())
      .getOrDefault(undefined);
  }

  hasType(typeName) {
    return typeName in this._types;
  }

  typeNames() {
    return Object.keys(this._types);
  }

  urlTemplates(): URLTemplates;
  urlTemplates(type: string): URLTemplatesForType;
  urlTemplates(type?: string) {
    if(type) {
      return Maybe(this._types[type])
        .map(it => it.get("urlTemplates"))
        .map(it => <URLTemplatesForType>it.toJS())
        .getOrDefault(undefined);
    }

    return Object.keys(this._types).reduce((prev, typeName) => {
      prev[typeName] = this.urlTemplates(typeName);
      return prev;
    }, <URLTemplates>{});
  }

  dbAdapter(type) {
    const adapter = this.doGet("dbAdapter", type);
    if(typeof adapter === 'undefined') {
      throw new Error(
        "Tried to get db adapter for a type registered without one. " +
        "Every type must be registered with an adapter!"
      );
    }

    return adapter;
  }

  beforeSave(type) {
    return this.doGet("beforeSave", type);
  }

  beforeRender(type) {
    return this.doGet("beforeRender", type);
  }

  behaviors(type) {
    return this.doGet("behaviors", type);
  }

  defaultIncludes(type) {
    return this.doGet("defaultIncludes", type);
  }

  info(type) {
    return this.doGet("info", type);
  }

  parentType(type) {
    return this.doGet("parentType", type);
  }

  private doGet<T extends keyof ResourceTypeDescription>(attrName: T, type): ResourceTypeDescription[T] | undefined {
    return Maybe(this._types[type])
      .map(it => it.get(attrName))
      .map(it => it instanceof Immutable.Map || it instanceof Immutable.List
        ? it.toJS()
        : it
      )
      .getOrDefault(undefined);
  }
}
