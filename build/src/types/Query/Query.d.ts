export declare type QueryOptions = {
    type: string;
};
declare abstract class Query {
    protected query: {
        type: string;
    };
    constructor(opts: QueryOptions);
    protected clone(): any;
    readonly type: string;
    forType(type: string): any;
}
export default Query;
