/**
 * This class represents the type of a field (i.e. what type of data it holds)
 * within a resource's schema.
 */
export default class FieldType {
  public baseType: string;
  public isArray: boolean;

  constructor(baseType, isArray = false) {
    [this.baseType, this.isArray] = [baseType, isArray];
  }

  toString() {
    return (this.isArray ? "Array[" : "") + this.baseType + (this.isArray ? "]" : "");
  }
}
