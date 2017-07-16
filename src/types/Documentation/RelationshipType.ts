import FieldType from "./FieldType";

export default class RelationshipType extends FieldType {
  public targetModel: string | undefined;
  public targetType: string | undefined;
  
  constructor(toMany, targetModel, targetType) {
    super("Relationship", toMany);
    [this.targetModel, this.targetType] = [targetModel, targetType];
  }

  toString() {
    return (this.isArray ? "Array[" : "") + this.targetModel + "Id" + (this.isArray ? "]" : "");
  }
}
