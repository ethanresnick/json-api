import Immutable = require("immutable");
import depd = require('depd');
import { pseudoTopSort } from "./util/misc";
import Maybe from "./types/Generic/Maybe";
import { ResourceTransformFn, FullTransformFn, TransformFn } from "./steps/apply-transform";
import { AdapterInstance } from "./db-adapters/AdapterInterface";
import Resource from "./types/Resource";
import ResourceIdentifier from "./types/ResourceIdentifier";
export { Resource, ResourceIdentifier, TransformFn };
const deprecate = depd("json-api");

/**
 * Global defaults for all resource descriptions, to be merged into the
 * defaults provided to the ResourceTypeRegistry, which are in turn merged
 * into the values provided in each resource type description.
 */
const globalResourceDefaults = Immutable.fromJS({
  transformLinkage: false
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
  beforeSave?: ResourceTransformFn | FullTransformFn,
  beforeRender?: ResourceTransformFn | FullTransformFn,
  behaviors?: object,
  transformLinkage?: boolean
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

  // Metadata about the structure of the type hierarchy.
  private _typesMetadata: {
    nodes: string[], // a list of all type names,
    roots: string[], // a list of all type names that don't have a parent type

    // A map, with each key being the name of a starting node A, and the value
    // being a set of node names for which there is an edge from A to that node.
    edges: { [srcNodeName: string]: { [targetNodeName: string]: true } }
  }

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
    // sort that works in this case.
    const nodes: string[] = [],
      roots: string[] = [],
      edges: { [a: string]: { [b: string]: true } } = {};

    Object.keys(typeDescs).forEach(typeName => {
      const nodeParentType = typeDescs[typeName].parentType;
      nodes.push(typeName);

      if(nodeParentType) {
        edges[nodeParentType] = edges[nodeParentType] || {};
        edges[nodeParentType][typeName] = true;
      }
      else {
        roots.push(typeName);
      }
    });

    // Store the sorted type metadata for later use.
    this._typesMetadata = { nodes, edges, roots };

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

  type(typeName: string) {
    return Maybe(this._types[typeName])
      .map(it => <ResourceTypeDescription>it.toJS())
      .getOrDefault(undefined);
  }

  hasType(typeName: string) {
    return typeName in this._types;
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

    return Object.keys(this._types).reduce<URLTemplates>((prev, typeName) => {
      prev[typeName] = this.urlTemplates(typeName);
      return prev;
    }, {});
  }

  dbAdapter(typeName: string) {
    const adapter = this.doGet("dbAdapter", typeName);
    if(typeof adapter === 'undefined') {
      throw new Error(
        "Tried to get db adapter for a type registered without one. " +
        "Every type must be registered with an adapter!"
      );
    }

    return adapter;
  }

  beforeSave(typeName: string) {
    return this.doGet("beforeSave", typeName);
  }

  beforeRender(typeName: string) {
    return this.doGet("beforeRender", typeName);
  }

  behaviors(typeName: string) {
    return this.doGet("behaviors", typeName);
  }

  defaultIncludes(typeName: string) {
    return this.doGet("defaultIncludes", typeName);
  }

  info(typeName: string) {
    return this.doGet("info", typeName);
  }

  transformLinkage(typeName: string) {
    return <boolean>this.doGet("transformLinkage", typeName);
  }

  parentType(typeName: string) {
    deprecate('parentType: use parentTypeName instead.');
    return this.doGet("parentType", typeName);
  }

  parentTypeName(typeName: string) {
    return this.doGet("parentType", typeName);
  }

  typeNames() {
    return Object.keys(this._types);
  }

  childTypeNames(typeName: string) {
    return Object.keys(this._typesMetadata.edges[typeName] || {});
  }

  rootTypeNames() {
    return Object.keys(this._types)
      .filter(typeName => this.parentTypeName(typeName) === undefined);
  }

  // Returns the top-most parent type's name for this type.
  rootTypeNameOf(typeName: string) {
    const pathToType = this.typePathTo(typeName);
    return pathToType[pathToType.length - 1];
  }

  typePathTo(typeName: string) {
    let path = [typeName];
    let parentType;

    while (parentType = this.parentTypeName(path[path.length - 1])) {
      path.push(parentType);
    }

    return path;
  }

  /**
   * Takes an list of types and checks if (were they appropriately reordered)
   * they would constitute a single path through the types tree. If the second
   * argument is provided, that path must point to (a child of) parentType.
   * If these conditions hold, it returns the types path; else false.
   *
   * @param {string[]} typesList A list of type names.
   * @param {string?} throughType A type name that the path must be or go through.
   */
  asTypePath(typesList: string[], throughType?: string): false | string[] {
    const pathToParentType = throughType ? this.typePathTo(throughType) : [];
    const remainingTypes = typesList.slice();

    if(!typesList.length) {
      return false;
    }

    for(const type of pathToParentType) {
      const indexOfType = remainingTypes.indexOf(type);

      // If the typelist doesn't have an item in the path to the parent type,
      // it can't be a path to that type or one of its children.
      if(indexOfType === -1) {
        return false;
      }

      remainingTypes.splice(indexOfType, 1);
    }

    // After we've checked that all the parent types are included in typesList,
    // any remaining types must be child types of parentType.
    let finalPath = [...pathToParentType];
    let currentTypeChildren = throughType
      ? this.childTypeNames(throughType)
      : this.rootTypeNames();

    while(remainingTypes.length && currentTypeChildren.length) {
      let nextTypeFound = false;

      for(const child of currentTypeChildren) {
        const indexOfChild = remainingTypes.indexOf(child);
        if(indexOfChild > -1) {
          nextTypeFound = true;
          remainingTypes.splice(indexOfChild, 1);
          currentTypeChildren = this.childTypeNames(child);
          finalPath.unshift(child);
          break;
        }
      }

      if(!nextTypeFound) {
        return false;
      }
    }

    return remainingTypes.length ? false : finalPath;
  }

  private doGet<T extends keyof ResourceTypeDescription>(attrName: T, typeName: string): ResourceTypeDescription[T] | undefined {
    return Maybe(this._types[typeName])
      .map(it => it.get(attrName))
      .map(it => it instanceof Immutable.Map || it instanceof Immutable.List
        ? it.toJS()
        : it
      )
      .getOrDefault(undefined);
  }
}
