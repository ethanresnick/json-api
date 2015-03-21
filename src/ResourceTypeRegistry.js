import Q from "q"
import mongoose from "mongoose"
import Document from "./types/Document"

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
  constructor() {
    this._resourceTypes = {};
  }

  type(type, description) {
    if(description) {
      this._resourceTypes[type] = {};

      // Set all the properties for the type that the description provides.
      ["adapter", "beforeSave", "afterQuery", "labelToIdOrIds",
      "urlTemplates", "defaultIncludes", "info", "parentType"].forEach((k) => {
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

ResourceTypeRegistry.prototype.adapter = makeGetterSetter("adapter");
ResourceTypeRegistry.prototype.beforeSave = makeGetterSetter("beforeSave");
ResourceTypeRegistry.prototype.afterQuery = makeGetterSetter("afterQuery");
ResourceTypeRegistry.prototype.labelMappers = makeGetterSetter("labelMappers");
ResourceTypeRegistry.prototype.defaultIncludes = makeGetterSetter("defaultIncludes");
ResourceTypeRegistry.prototype.info = makeGetterSetter("info");
ResourceTypeRegistry.prototype.parentType = makeGetterSetter("parentType");


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
