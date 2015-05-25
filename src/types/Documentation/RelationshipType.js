import FieldType from "./FieldType";

export default class RelationshipType extends FieldType {
  constructor(toMany, targetModel, targetType) {
    [this.targetModel, this.targetType] = [targetModel, targetType];
    super("Relationship", toMany);
  }

  toString() {
    return (this.isArray ? 'Array[' : '') + this.targetModel + 'Id' + (this.isArray ? ']' : '');
  }
}
