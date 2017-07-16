import FieldType from './FieldType';

export default class Field {
  public kind: FieldType | undefined;
  public name: string;
  public validation: object;
  public friendlyName: string | undefined;
  public default: any;

  constructor(name: string, type?: FieldType, validation = {}, friendlyName?: string, defaultVal?) {
    // call the property kind to
    // distinguish it from json api type
    this.kind = type;

    this.name = name;
    this.validation = validation;
    this.friendlyName = friendlyName;
    this.default = defaultVal;
  }
}
