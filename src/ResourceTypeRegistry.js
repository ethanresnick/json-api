import Immutable from "immutable";
import {pseudoTopSort} from "./util/misc";

/**
 * A private array of properties that will be used by the class below to
 * automatically generate simple getters for each property, all following the
 * same format. Those getters will take the name of the resource type whose
 * property is being retrieved.
 */
const autoGetterProps = ["dbAdapter", "beforeSave", "beforeRender", "behaviors",
  "labelMappers", "defaultIncludes", "info", "parentType"];

/**
 * Global defaults for all resource descriptions, to be merged into the
 * defaults provided to the ResourceTypeRegistry, which are in turn merged
 * into the values provided in each resource type description.
 */
const globalResourceDefaults = Immutable.fromJS({
  behaviors: {
    dasherizeOutput: { enabled: true }
  }
});

const typesKey = Symbol();

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
  constructor(typeDescriptions = {}, descriptionDefaults = {}) {
    this[typesKey] = {};
    descriptionDefaults = globalResourceDefaults.mergeDeep(descriptionDefaults);

    // Sort the types so we can register them in an order that respects their
    // parentType. First, we pre-process the typeDescriptions to create edges
    // pointing to each node's children (rather than the links we have by
    // default, which point to the parent). Then we do an abridged topological
    // sort that works in this case. Below, nodes is a list of type names.
    // Roots are nodes with no parents. Edges is a map, with each key being the
    // name of a starting node A, and the value being a set of node names for
    // which there is an edge from A to that node.
    const nodes = [], roots = [], edges = {};

    for(const typeName in typeDescriptions) {
      const nodeParentType = typeDescriptions[typeName].parentType;
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
      const parentType = typeDescriptions[typeName].parentType;

      // defaultIncludes need to be made into an object if they came as an array.
      // TODO: Remove support for array format before v3. It's inconsistent.
      const thisDescriptionRaw = Immutable.fromJS(typeDescriptions[typeName]);
      const thisDescriptionMerged = descriptionDefaults.mergeDeep(thisDescriptionRaw);

      this[typesKey][typeName] = (parentType) ?
        // If we have a parentType, we merge in all the parent's fields,
        // BUT we then overwrite labelMappers with just the ones directly
        // from this description. We don't inherit labelMappers because a
        // labelMapper is a kind of filter, and the results of a filter
        // on the parent type may not be instances of the subtype.
        this[typesKey][parentType].mergeDeep(thisDescriptionRaw)
          .set("labelMappers", thisDescriptionRaw.get("labelMappers")) :

        // If we don't have a parentType, just register
        // the description merged with the universal defaults
        thisDescriptionMerged;
    });
  }

  type(typeName) {
    return this.hasType(typeName) ? this[typesKey][typeName].toJS() : undefined;
  }

  hasType(typeName) {
    return typeName in this[typesKey];
  }

  typeNames() {
    return Object.keys(this[typesKey]);
  }

  urlTemplates(type) {
    if(type) {
      const maybeDesc = this[typesKey][type];
      const maybeTemplates = maybeDesc ? maybeDesc.get("urlTemplates") : maybeDesc;
      return maybeTemplates ? maybeTemplates.toJS() : maybeTemplates;
    }

    return Object.keys(this[typesKey]).reduce((prev, typeName) => {
      prev[typeName] = this.urlTemplates(typeName);
      return prev;
    }, {});
  }
}

autoGetterProps.forEach((propName) => {
  ResourceTypeRegistry.prototype[propName] = makeGetter(propName);
});

function makeGetter(attrName) {
  return function(type) {
    const maybeDesc = this[typesKey][type];
    const maybeVal = maybeDesc ? maybeDesc.get(attrName) : maybeDesc;

    if(maybeVal instanceof Immutable.Map || maybeVal instanceof Immutable.List) {
      return maybeVal.toJS();
    }

    return maybeVal;
  };
}
