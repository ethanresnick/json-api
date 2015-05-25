import FieldType from "./FieldType";

export default class Field {
  constructor(name, type, validation = {}, friendlyName, defaultVal) {
    // call the property kind to
    // distinguish it from json api type
    this.kind = type;

    this.name = name;
    this.validation = validation;
    this.friendlyName = friendlyName;
    this.default = defaultVal;
  }
}
