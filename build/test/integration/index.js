"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const database_1 = require("../app/database");
Q.longStackSupport = true;
before((done) => {
    database_1.default.then((module) => {
        module.fixturesReset().then((data) => {
            require("./http-compliance");
            require("./content-negotiation");
            require("./fetch-collection");
            require("./create-resource");
            require("./patch-relationship");
            require("./delete-resource");
            require("./documentation");
            done();
        }).done();
    }).catch(done);
});
