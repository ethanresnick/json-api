import Resource from './Resource';
import Data from './Generic/Data';
import { UrlTemplateFnsByType, DataWithLinksArgs } from "./index";
import MaybeDataWithLinks from "./MaybeDataWithLinks";
export default class ResourceSet extends MaybeDataWithLinks<Resource> {
    protected data: Data<Resource>;
    protected constructor(it: DataWithLinksArgs<Resource>);
    readonly ids: Data<string | undefined>;
    readonly types: Data<string>;
    toJSON(urlTemplates: UrlTemplateFnsByType): {
        links: {
            [linkName: string]: any;
        };
        data: {
            id: string;
            type: string;
            attributes?: object | undefined;
            relationships?: {
                [name: string]: {
                    data?: {
                        type: string;
                        id: string;
                    } | {
                        type: string;
                        id: string;
                    }[] | null | undefined;
                    links?: {
                        self?: string | undefined;
                        related?: string | undefined;
                    } | undefined;
                };
            } | undefined;
            meta?: object | undefined;
            links?: {
                self?: string | undefined;
            } | undefined;
        } | {
            id: string;
            type: string;
            attributes?: object | undefined;
            relationships?: {
                [name: string]: {
                    data?: {
                        type: string;
                        id: string;
                    } | {
                        type: string;
                        id: string;
                    }[] | null | undefined;
                    links?: {
                        self?: string | undefined;
                        related?: string | undefined;
                    } | undefined;
                };
            } | undefined;
            meta?: object | undefined;
            links?: {
                self?: string | undefined;
            } | undefined;
        }[] | null | undefined;
    };
    static of(it: DataWithLinksArgs<Resource>): ResourceSet;
}
