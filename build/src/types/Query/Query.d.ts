export declare type QueryOptions = {
    using: string;
};
declare abstract class Query {
    protected query: {
        using: string;
    };
    constructor(opts: QueryOptions);
    protected clone(): any;
    readonly using: string;
}
export default Query;
