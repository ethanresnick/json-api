"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const API = require("../../../src/index");
const index_1 = require("../database/index");
exports.default = index_1.default.then(function (dbModule) {
    const adapter = new API.dbAdapters.Mongoose(dbModule.models());
    const registry = new API.ResourceTypeRegistry({
        "people": require("./resource-descriptions/people"),
        "organizations": require("./resource-descriptions/organizations"),
        "schools": require("./resource-descriptions/schools")
    }, {
        dbAdapter: adapter
    });
    const Docs = new API.controllers.Documentation(registry, { name: "Example API" });
    const Controller = new API.controllers.API(registry);
    const app = express();
    const port = process.env.PORT || "3000";
    const host = process.env.HOST || "127.0.0.1";
    const Front = new API.httpStrategies.Express(Controller, Docs, { host: host + ":" + port });
    const apiReqHandler = Front.apiRequest.bind(Front);
    app.get('/:type(people)/non-binary', Front.transformedAPIRequest((req, query) => query.andWhere({ field: "gender", operator: "nin", value: ["male", "female"] })));
    app.get("/", Front.docsRequest.bind(Front));
    app.route("/:type(people|organizations|schools)").all(apiReqHandler);
    app.route("/:type(people|organizations|schools)/:id")
        .get(apiReqHandler).patch(apiReqHandler).delete(apiReqHandler);
    app.route("/:type(organizations|schools)/:id/:related")
        .get(apiReqHandler);
    app.route("/:type(people|organizations|schools)/:id/relationships/:relationship")
        .get(apiReqHandler).post(apiReqHandler).patch(apiReqHandler);
    app.use(function (req, res, next) {
        Front.sendError({ "message": "Not Found", "status": 404 }, req, res);
    });
    return app;
});
