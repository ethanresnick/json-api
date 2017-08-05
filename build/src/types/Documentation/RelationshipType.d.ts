import FieldType from "./FieldType";
export default class RelationshipType extends FieldType {
    targetModel: string | undefined;
    targetType: string | undefined;
    constructor(toMany: any, targetModel: any, targetType: any);
    toString(): string;
}
