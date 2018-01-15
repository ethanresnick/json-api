"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../app/database");
before(() => {
    return database_1.default.then((module) => {
        return module.fixturesReset().then((data) => {
            require("./content-negotiation");
            require("./create-resource");
            require("./custom-query");
            require("./delete-resource");
            require("./documentation");
            require("./error-handling");
            require("./fetch-collection");
            require("./fetch-relationship");
            require("./fetch-resource");
            require("./http-compliance");
            require("./patch-relationship");
            require("./update-resource");
        });
    });
});
