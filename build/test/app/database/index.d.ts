/// <reference types="mongoose" />
import mongoose = require("mongoose");
declare const _default: Promise<{
    models(): {
        Person: mongoose.Model<mongoose.Document>;
        Organization: mongoose.Model<mongoose.Document>;
        School: any;
    };
    instance(): typeof mongoose;
    fixturesRemoveAll(): Promise<{}>;
    fixturesReset(): any;
}>;
export default _default;
