import Data from './Data';
import Resource from './Resource';
import ResourceIdentifier from './ResourceIdentifier';
import { Reducer, PredicateFn, UrlTemplateFns, Mapper, AsyncMapper } from "./index";
export declare type MaybeDataWithLinksArgs<T> = {
    data: T | T[] | null | undefined | Data<T>;
    links?: UrlTemplateFns;
};
export default class MaybeDataWithLinks<T extends (Resource | ResourceIdentifier)> {
    protected data: Data<T> | undefined;
    links: UrlTemplateFns;
    protected constructor({data, links}: MaybeDataWithLinksArgs<T>);
    readonly values: T[];
    map(fn: Mapper<T, T>): MaybeDataWithLinks<T>;
    mapAsync(fn: AsyncMapper<T, T>): Promise<MaybeDataWithLinks<T>>;
    flatMap(fn: (it: T) => Data<T>): MaybeDataWithLinks<T>;
    flatMapAsync(fn: (it: T) => Data<T> | Promise<Data<T>>): Promise<MaybeDataWithLinks<T>>;
    unwrapWith<U>(fn: (it: T) => U, linkTemplateData: any): {
        links: {
            [linkName: string]: string;
        };
        data: U | U[] | null | undefined;
    };
    every(fn: PredicateFn<T>): boolean;
    reduce<U, V>(fn: Reducer<T, U>, initialValue?: V): any;
    forEach(fn: (it: T) => void): void;
}
