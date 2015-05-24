/**
 * A private array of properties that will be used by the class below to
 * automatically generate simple getter setters for each property, all
 * following same format. Those getters/setters will take the resource type
 * whose property is being retrieved/set, and the value to set it to, if any.
 */
const autoGetterSetterProps = ["dbAdapter", "beforeSave", "beforeRender",
  "labelMappers", "defaultIncludes", "info", "parentType"];

/**
 * To fulfill a JSON API request, you often need to know about all the resources
 * in the system--not just the primary resource associated with the type being
 * requested. For example, if the request is for a User, you might need to
 * include related Projects, so the code handling the users request needs access
 * to the Project resource's beforeSave and afterQuery methods. Similarly, it
 * would need access to url templates that point at relationships on the Project
 * resources. Etc. So we handle this by introducing a ResourceTypeRegistry that
 * the Dispatcher can have access to. Each resource type is registered by its
 * JSON api type and has a number of properties defining it.
 */
export default class ResourceTypeRegistry {
  constructor(typeDescriptions = []) {
    this._resourceTypes = {};
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

      // Set all the properties for the type that the description provides.
      autoGetterSetterProps.concat(["urlTemplates"]).forEach((k) => {
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
        return this._resourceTypes[type].urlTemplates;

      case 0:
        let templates = {};
        for(let type in this._resourceTypes) {
          templates[type] = Object.assign({}, this._resourceTypes[type].urlTemplates || {});
        }
        return templates;

      default:
        this._resourceTypes[type].urlTemplates = templatesToSet;
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
