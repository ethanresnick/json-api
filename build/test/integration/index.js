"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../app/database");
before((done) => {
    database_1.default.then((module) => {
        return module.fixturesReset().then((data) => {
            require("./http-compliance");
            require("./content-negotiation");
            require("./fetch-collection");
            require("./create-resource");
            require("./patch-relationship");
            require("./delete-resource");
            require("./documentation");
            done();
        });
    }).catch(done);
});
