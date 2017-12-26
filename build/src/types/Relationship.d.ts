import { LinkageJSON, UrlTemplateFns, Mapper, AsyncMapper } from "./index";
import Data from "./Data";
import MaybeDataWithLinks, { MaybeDataWithLinksArgs } from "./MaybeDataWithLinks";
import ResourceIdentifier from "./ResourceIdentifier";
export declare type RelationshipJSON = {
    data?: LinkageJSON;
    links?: RelationshipLinksJSON;
};
export declare type RelationshipLinksJSON = {
    self?: string;
    related?: string;
};
export declare type RelationshipOwner = {
    type: string;
    id: string;
    path: string;
};
export declare type RelationshipArgs = MaybeDataWithLinksArgs<ResourceIdentifier> & {
    owner: RelationshipOwner;
};
export default class Relationship extends MaybeDataWithLinks<ResourceIdentifier> {
    owner: RelationshipOwner;
    protected constructor(it: RelationshipArgs);
    static of(it: RelationshipArgs): Relationship;
    map(fn: Mapper<ResourceIdentifier, ResourceIdentifier>): any;
    mapAsync(fn: AsyncMapper<ResourceIdentifier, ResourceIdentifier>): any;
    flatMap(fn: (it: ResourceIdentifier) => Data<ResourceIdentifier>): any;
    flatMapAsync(fn: (it: ResourceIdentifier) => Data<ResourceIdentifier> | Promise<Data<ResourceIdentifier>>): any;
    toJSON(fallbackTemplates: UrlTemplateFns): RelationshipJSON;
}
