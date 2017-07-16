import Resource from './Resource';
export default class Collection {
    resources: Resource[];
    constructor(resources?: Resource[]);
    readonly ids: (string | undefined)[];
    readonly types: string[];
    add(resource: any): void;
}
