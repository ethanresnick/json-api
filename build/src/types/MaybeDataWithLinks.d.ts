import Data from './Generic/Data';
import Resource from './Resource';
import ResourceIdentifier from './ResourceIdentifier';
import { Reducer, PredicateFn, UrlTemplateFns, Mapper, AsyncMapper, Links } from "./index";
export declare type MaybeDataWithLinksArgs<T> = {
    data: T | T[] | null | undefined | Data<T>;
    links?: UrlTemplateFns;
};
export declare type DataSyncMethods = "flatMap" | "map" | "filter";
export declare type DataAsyncMethods = "flatMapAsync" | "mapAsync";
export default class MaybeDataWithLinks<T extends (Resource | ResourceIdentifier)> {
    protected data: Data<T> | undefined;
    links: UrlTemplateFns;
    protected constructor({data, links}: MaybeDataWithLinksArgs<T>);
    readonly values: T[];
    map(fn: Mapper<T, T>): this;
    flatMap(fn: (it: T) => Data<T>): this;
    filter(fn: PredicateFn<T>): this;
    mapAsync(fn: AsyncMapper<T, T>): Promise<this>;
    flatMapAsync(fn: (it: T) => Data<T> | Promise<Data<T>>): Promise<this>;
    unwrapWith<U>(fn: (it: T) => U, linkTemplateData: any): {
        links: Links;
        data: U | U[] | null | undefined;
    };
    unwrapDataWith<U>(fn: (it: T) => U): U | U[] | null | undefined;
    every(fn: PredicateFn<T>): boolean;
    some(fn: PredicateFn<T>): boolean;
    reduce<U>(fn: Reducer<T, U>, initialValue?: U): U | undefined;
    forEach(fn: (it: T) => void): this;
    protected clone(): this;
    protected delegateDataTransformToParent(methodName: DataSyncMethods, args: any): this;
    protected delegateDataTransformToParentAsync(methodName: DataAsyncMethods, args: any): Promise<this>;
    protected withNewData(newData: any): this;
}
