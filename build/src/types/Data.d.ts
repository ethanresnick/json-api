import { DataOf, Reducer, PredicateFn, Mapper, AsyncMapper } from "./index";
export declare type INTERNAL_DONT_USE<T> = {
    data: T[];
    isSingular: boolean;
};
export default class Data<T> {
    private value;
    protected constructor(value: INTERNAL_DONT_USE<T>);
    private flatMapHelper<U>(newDatas);
    flatMap<U>(fn: (it: T) => Data<U>): Data<U>;
    flatMapAsync<U>(fn: (it: T) => Data<U> | Promise<Data<U>>): Promise<Data<U>>;
    private mapHelper<U>(newValues);
    map<U>(fn: Mapper<T, U>): Data<U>;
    mapAsync<U>(fn: AsyncMapper<T, U>): Promise<Data<U>>;
    every(fn: PredicateFn<T>): boolean;
    some(fn: PredicateFn<T>): boolean;
    forEach(fn: (it: T) => void): this;
    reduce(fn: Reducer<T, any>, initialValue?: any): any;
    filter(fn: PredicateFn<T>): Data<T>;
    unwrap(): T | T[] | null;
    readonly isSingular: boolean;
    readonly values: T[];
    readonly size: number;
    static fromJSON<T>(data: DataOf<T>): Data<T>;
    static empty: Data<any>;
    static of<U>(data: U[]): Data<U>;
    static pure<U>(data: U): Data<U>;
}
