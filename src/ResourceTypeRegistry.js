import merge from "lodash/object/merge";

/**
 * A private array of properties that will be used by the class below to
 * automatically generate simple getter setters for each property, all
 * following same format. Those getters/setters will take the resource type
 * whose property is being retrieved/set, and the value to set it to, if any.
 */
const autoGetterSetterProps = ["dbAdapter", "beforeSave", "beforeRender",
  "labelMappers", "defaultIncludes", "info", "parentType"];

/**
 * Global defaults for resource descriptions, to be merged into defaults
 * provided to the ResourceTypeRegistry, which are in turn merged into defaults
 * provided in each resource type descriptions.
 */
const globalResourceDefaults = {
  behaviors: {
    dasherizeOutput: { enabled: true }
  }
};

/**
 * To fulfill a JSON API request, you often need to know about all the resources
 * in the system--not just the primary resource associated with the type being
 * requested. For example, if the request is for a User, you might need to
 * include related Projects, so the code handling the users request needs access
 * to the Project resource's beforeSave and beforeRender methods. Similarly, it
 * would need access to url templates that point at relationships on the Project
 * resources. Etc. So we handle this by introducing a ResourceTypeRegistry that
 * the Controller can have access to. Each resource type is registered by its
 * JSON API type and has a number of properties defining it.
 */
export default class ResourceTypeRegistry {
  constructor(typeDescriptions = [], descriptionDefaults = {}) {
    this._resourceTypes = {};
    this._descriptionDefaults = merge({}, globalResourceDefaults, descriptionDefaults);
    typeDescriptions.forEach((it) => { this.type(it); });
  }

  type(type, description) {
    // create a one-argument version that takes the
    // type as a key on the description object.
    if(typeof type === "object" && typeof description === "undefined") {
      description = type;
      type = type.type;
      delete description.type;
    }

    if(description) {
      this._resourceTypes[type] = {};

      // Merge description defaults into provided description
      description = merge({}, this._descriptionDefaults, description);

      // Set all the properties for the type that the description provides.
      autoGetterSetterProps.concat(["urlTemplates", "behaviors"]).forEach((k) => {
        if(Object.prototype.hasOwnProperty.call(description, k)) {
          this[k](type, description[k]);
        }
      });
    }
    else if(this._resourceTypes[type]) {
      return Object.assign({}, this._resourceTypes[type]);
    }
  }

  types() {
    return Object.keys(this._resourceTypes);
  }

  //calling the arg "templatesToSet" to avoid conflict with templates var below
  urlTemplates(type, templatesToSet) {
    this._resourceTypes[type] = this._resourceTypes[type] || {};

    switch(arguments.length) {
      case 1:
        return this._resourceTypes[type].urlTemplates
          ? Object.assign({}, this._resourceTypes[type].urlTemplates)
          : this._resourceTypes[type].urlTemplates;

      case 0:
        let templates = {};
        for(let currType in this._resourceTypes) {
          templates[currType] = this.urlTemplates(currType);
        }
        return templates;

      default:
        this._resourceTypes[type].urlTemplates = templatesToSet;
    }
  }

  behaviors(type, behaviorsToSet) {
    this._resourceTypes[type] = this._resourceTypes[type] || {};
    if (behaviorsToSet) {
      this._resourceTypes[type].behaviors =
        merge({}, this._descriptionDefaults.behaviors, behaviorsToSet);
    }

    else {
      return this._resourceTypes[type].behaviors;
    }
  }
}

autoGetterSetterProps.forEach((propName) => {
  ResourceTypeRegistry.prototype[propName] = makeGetterSetter(propName);
});


function makeGetterSetter(attrName) {
  return function(type, optValue) {
    this._resourceTypes[type] = this._resourceTypes[type] || {};

    if(optValue) {
      this._resourceTypes[type][attrName] = optValue;
    }

    else {
      return this._resourceTypes[type][attrName];
    }
  };
}
