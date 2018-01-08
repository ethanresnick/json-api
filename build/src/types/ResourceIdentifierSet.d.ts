import ResourceIdentifier from './ResourceIdentifier';
import { DataWithLinksArgs } from "./index";
import MaybeDataWithLinks from "./MaybeDataWithLinks";
export default class ResourceIdentifierSet extends MaybeDataWithLinks<ResourceIdentifier> {
    toJSON(): {
        links: {
            [linkName: string]: any;
        };
        data: {
            id: string;
            type: string;
        } | {
            id: string;
            type: string;
        }[] | null | undefined;
    };
    static of(it: DataWithLinksArgs<ResourceIdentifier>): ResourceIdentifierSet;
}
