import Immutable = require("immutable");
import mapObject = require("lodash/mapValues"); //tslint:disable-line no-submodule-imports
import { pseudoTopSort } from "./util/misc";
import Maybe from "./types/Generic/Maybe";
import {
  ResourceTransformFn,
  FullTransformFn,
  TransformFn,
  BeforeRenderFullTransformFn,
  BeforeRenderResourceTransformFn
} from "./steps/make-transform-fn";
import { AdapterInstance } from "./db-adapters/AdapterInterface";
import { UrlTemplate, fromRFC6570 } from "./types/UrlTemplate";
import Resource from "./types/Resource";
import ResourceIdentifier from "./types/ResourceIdentifier";
import { UrlTemplates, UrlTemplatesByType } from "./types";
import { IncomingMessage, ServerResponse } from "http";
export { Resource, ResourceIdentifier, TransformFn, IncomingMessage, ServerResponse };

/**
 * Global defaults for all resource descriptions, to be merged into the
 * defaults provided to the ResourceTypeRegistry, which are in turn merged
 * into the values provided in each resource type description.
 */
const globalResourceDefaults = Immutable.fromJS({
  transformLinkage: false,
  pagination: {}
}) as Immutable.Map<string, any>;

// We allow strings when a template is provided,
// but always output a parsed template function.
export type InputURLTemplates =
  { [linkName: string]: UrlTemplate | string };

export type ResourceTypeInfo = {
  fields?: { [fieldName: string]: any };
  example?: string;
  description?: string;
};

export type InputErrorsConfig = {
  urlTemplates: { about: InputURLTemplates['about'] }
};

export type ErrorsConfig = {
  urlTemplates: UrlTemplates
};

export type ResourceTypeDescription = {
  dbAdapter?: AdapterInstance<any>;
  info?: ResourceTypeInfo;
  defaultIncludes?: string[];
  parentType?: string;
  urlTemplates?: InputURLTemplates;
  beforeSave?: ResourceTransformFn | FullTransformFn;
  beforeRender?: BeforeRenderResourceTransformFn | BeforeRenderFullTransformFn;
  transformLinkage?: boolean;
  pagination?: { maxPageSize?: number; defaultPageSize?: number };
};

export type ResourceTypeDescriptions = {
  [typeName: string]: ResourceTypeDescription;
};

export type OutputResourceTypeDescription =
  ResourceTypeDescription
    & { urlTemplates: UrlTemplates }
    // pagination is always present b/c we default it to at least an empty object.
    & Required<Pick<ResourceTypeDescription, "dbAdapter" | "pagination">>;

/**
 * To fulfill a JSON API request, you often need to know about all the resources
 * types in the system--not just the type that is the primary target of the
 * request. For example, if the request is for a User (or Users), you might need
 * to include related Projects, so the code handling the users request needs
 * access to the Project resource's beforeSave and beforeRender methods; its
 * url templates; etc. So we handle this by introducing a ResourceTypeRegistry
 * that the Controller can have access to. Each resource type is registered by
 * its JSON API type and has a number of properties defining it.
 *
 * We also register other global configuration (e.g., for errors) with this
 * instance, making the name imperfect/a bit of a misnomer.
 */
export default class ResourceTypeRegistry {
  private _types: {
    [typeName: string]: Immutable.Map<string, any> | undefined;
  };

  // Metadata about the structure of the type hierarchy.
  private _typesMetadata: {
    nodes: string[]; // a list of all type names,
    roots: string[]; // a list of all type names that don't have a parent type

    // A map, with each key being the name of a starting node A, and the value
    // being a set of node names for which there is an edge from A to that node.
    edges: { [srcNodeName: string]: { [targetNodeName: string]: true } };
  };

  private _errorsConfig?: ErrorsConfig;

  constructor(
    typeDescs: ResourceTypeDescriptions = Object.create(null),
    descDefaults: Partial<ResourceTypeDescription> = {},
    errorsConfig?: InputErrorsConfig
  ) {

    this._errorsConfig = errorsConfig && {
      ...errorsConfig,
      urlTemplates: this.processUrlTemplates(errorsConfig.urlTemplates)
    };

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

    const typeRegistrationOrder = pseudoTopSort(nodes, edges, roots);

    // Store the sorted type metadata for later use,
    // and setup basic state to register the types.
    this._types = {};
    this._typesMetadata = { nodes, edges, roots };
    const instanceDefaults = globalResourceDefaults.mergeDeep(
      this.processTypeDesc(descDefaults)
    );

    // register the types, in order
    typeRegistrationOrder.forEach((typeName) => {
      // Process the type desc.
      // TODO: defaultIncludes need to be made into an object if they came as
      // an array. Remove support for array format before v3. It's inconsistent.
      const thisDescProcessed = this.processTypeDesc(typeDescs[typeName]);
      const thisDescImmutable = Immutable.fromJS(thisDescProcessed);

      // If we don't have a parent type, we merge the description with the
      // general defaults. If we do have a parent type, we merge the description
      // with that (which will have itself been merged with the general defaults
      // at some point). If we had properties we didn't want to merge, we could
      // reset them post-merge with .set("prop", thisDescriptionRaw.get("prop")).
      const { parentType } = typeDescs[typeName];
      const thisDescBase = parentType
        ? this._types[parentType]! // tslint:disable-line no-non-null-assertion
        : instanceDefaults;

      this._types[typeName] = thisDescBase.mergeDeep(thisDescImmutable);

      // tslint:disable-next-line no-non-null-assertion
      if(!this._types[typeName]!.get("dbAdapter")) {
        throw new Error(
          "Every resource type must be registered with a db adapter!"
        );
      }
    });
  }

  errorsConfig() {
    return this._errorsConfig;
  }

  type(typeName: string) {
    return Maybe(this._types[typeName])
      .map(it => <OutputResourceTypeDescription>it.toJS())
      .getOrDefault(undefined); // tslint:disable-line
  }

  hasType(typeName: string) {
    return typeName in this._types;
  }

  urlTemplates(): UrlTemplatesByType;
  urlTemplates(type: string): UrlTemplates | undefined;
  urlTemplates(type?: string) {
    if(type) {
      return Maybe(this._types[type])
        .map(it => it.get("urlTemplates"))
        .map(it => <UrlTemplates>it.toJS())
        .getOrDefault(undefined); // tslint:disable-line
    }

    return Object.keys(this._types).reduce<UrlTemplatesByType>((prev, typeName) => {
      //tslint:disable-next-line no-non-null-assertion
      prev[typeName] = this.urlTemplates(typeName)!;
      return prev;
    }, {});
  }

  dbAdapter(typeName: string) {
    return this.doGet("dbAdapter", typeName);
  }

  uniqueAdapters() {
    const adaptersToTypeNames = new Map<AdapterInstance<any>, string[]>();
    Object.keys(this._types).forEach(typeName => {
      // tslint:disable-next-line no-non-null-assertion
      const adapter = this._types[typeName]!.get("dbAdapter");

      adaptersToTypeNames.set(
        adapter,
        (adaptersToTypeNames.get(adapter) || []).concat(typeName)
      );
    });

    return adaptersToTypeNames;
  }

  beforeSave(typeName: string) {
    return this.doGet("beforeSave", typeName);
  }

  beforeRender(typeName: string) {
    return this.doGet("beforeRender", typeName);
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

  parentTypeName(typeName: string) {
    return this.doGet("parentType", typeName);
  }

  pagination(typeName: string) {
    return this.doGet("pagination", typeName);
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
    const path = [typeName];
    let parentType;

    // tslint:disable-next-line:no-conditional-assignment
    while ((parentType = this.parentTypeName(path[path.length - 1]))) {
      path.push(parentType);
    }

    return path;
  }

  /**
   * Takes an list of types and checks if (were they appropriately reordered)
   * they would constitute a single path through the types tree. If the second
   * argument is provided, that path must end at or pass through that type.
   * If these conditions hold, it returns the types path; else false.
   * The list can't have extra elements.
   *
   * @param {string[]} typesList A list of type names.
   * @param {string?} throughType A type name that the path must be or go through.
   */
  asTypePath(typesList: string[], throughType?: string): false | string[] {
    const pathToThroughType = throughType ? this.typePathTo(throughType) : [];
    const partialPath = [...pathToThroughType];

    if(!typesList.length) {
      return false;
    }

    const typesNotOnPathToThroughType = typesList.slice();
    for(const type of pathToThroughType) {
      const indexOfType = typesNotOnPathToThroughType.indexOf(type);

      // If the typelist doesn't have an item in the path to the throughType,
      // it can't be a path to that type or one of its children. Bail early.
      if(indexOfType === -1) {
        return false;
      }

      typesNotOnPathToThroughType.splice(indexOfType, 1);
    }

    // This is a function we call recursively to do the main traversing step.
    // It takes a partial type path, and some remaining types, and extends
    // the type path recursively by breadth-first searching the type tree.
    const completeTypePath = (remainingTypes, typePath) => {
      if(!remainingTypes.length) {
        return typePath;
      }

      const candidateChildren = typePath.length === 0
        ? this.rootTypeNames()
        : this.childTypeNames(typePath[0]);

      for(const child of candidateChildren) {
        const indexOfType = remainingTypes.indexOf(child);
        if(indexOfType > -1) {
          return completeTypePath(
            [...remainingTypes.slice(0, indexOfType), ...remainingTypes.slice(indexOfType + 1)],
            [child, ...typePath]
          );
        }
      }

      // Reached a dead end, in that we couldn't find any of our
      // candidate types in remainingTypes.
      return false;
    }

    return completeTypePath(typesNotOnPathToThroughType, partialPath);
  }

  private doGet<T extends keyof ResourceTypeDescription>(attrName: T, typeName: string): ResourceTypeDescription[T] | undefined {
    return Maybe(this._types[typeName])
      .map(it => it.get(attrName))
      .map(it => it instanceof Immutable.Map || it instanceof Immutable.List
        ? it.toJS()
        : it
      )
      .getOrDefault(undefined); // tslint:disable-line
  }

  private processTypeDesc(it: Partial<ResourceTypeDescription>) {
    if(it.urlTemplates) {
      return {
        ...it,
        urlTemplates: this.processUrlTemplates(it.urlTemplates)
      };
    }

    return it;
  }

  private processUrlTemplates(it: InputURLTemplates) {
    return mapObject(it, template => {
      return typeof template === 'string' ? fromRFC6570(template) : template;
    });
  }
}
