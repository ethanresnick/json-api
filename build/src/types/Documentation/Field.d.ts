import FieldType from './FieldType';
export default class Field {
    kind: FieldType | undefined;
    name: string;
    validation: object;
    friendlyName: string | undefined;
    default: any;
    constructor(name: string, type?: FieldType, validation?: {}, friendlyName?: string, defaultVal?: any);
}
