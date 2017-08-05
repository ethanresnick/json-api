/// <reference types="q" />
/// <reference types="mongoose" />
import Q = require("q");
import mongoose = require("mongoose");
declare const _default: Q.Promise<{
    models(): {
        Person: mongoose.Model<mongoose.Document>;
        Organization: mongoose.Model<mongoose.Document>;
        School: any;
    };
    instance(): typeof mongoose;
    fixturesRemoveAll(): any;
    fixturesReset(): any;
}>;
export default _default;
