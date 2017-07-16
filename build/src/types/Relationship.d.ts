import { default as Linkage, LinkageJSON } from "./Linkage";
export declare type RelationshipJSON = {
    data: LinkageJSON;
    links?: RelationshipLinksJSON;
} | {
    data: undefined;
    links: RelationshipLinksJSON;
};
export declare type RelationshipLinksJSON = {
    self?: string;
    related?: string;
};
export default class Relationship {
    linkage: Linkage | undefined;
    relatedURITemplate: string | undefined;
    selfURITemplate: string | undefined;
    constructor(linkage: any, relatedURITemplate?: string | undefined, selfURITemplate?: string | undefined);
    empty(): void;
}
