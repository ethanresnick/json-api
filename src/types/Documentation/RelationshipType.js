import FieldType from "./FieldType";

export default class RelationshipType extends FieldType {
  constructor(toMany, targetModel, targetType) {
    super("Relationship", toMany);
    [this.targetModel, this.targetType] = [targetModel, targetType];
  }

  toString() {
    return (this.isArray ? "Array[" : "") + this.targetModel + "Id" + (this.isArray ? "]" : "");
  }
}
