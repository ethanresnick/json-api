export declare type LinkageJSON = any;
export default class Linkage {
    value: any;
    constructor(value: any);
    set(value: any): void;
    add(newValue: any): void;
    empty(): void;
    toJSON(): LinkageJSON;
}
