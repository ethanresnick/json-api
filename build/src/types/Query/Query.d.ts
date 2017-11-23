import { Result } from '../index';
export declare type QueryOptions = {
    type: string;
    returning: (result: any) => Result;
    catch?: (err: any) => Result;
};
declare abstract class Query {
    protected query: {
        type: QueryOptions['type'];
        returning: QueryOptions['returning'];
        catch?: QueryOptions['catch'];
    };
    constructor(opts: QueryOptions);
    protected clone(): any;
    readonly type: string;
    readonly returning: (result: any) => Result;
    readonly catch: ((err: any) => Result) | undefined;
    resultsIn(success?: QueryOptions['returning'], fail?: QueryOptions['catch']): any;
    forType(type: string): any;
}
export default Query;
