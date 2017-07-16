export default class FieldType {
    baseType: string;
    isArray: boolean;
    constructor(baseType: any, isArray?: boolean);
    toString(): string;
}
