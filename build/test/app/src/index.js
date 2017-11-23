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
    const Front = new API.httpStrategies.Express(Controller, Docs);
    const apiReqHandler = Front.apiRequest.bind(Front);
    const FrontWith406Delegation = new API.httpStrategies.Express(Controller, Docs, {
        handleContentNegotiation: false
    });
    app.get('/:type(organizations)/no-id/406-delegation-test', FrontWith406Delegation.apiRequest.bind(FrontWith406Delegation), (req, res, next) => {
        res.header('Content-Type', 'text/plain');
        res.send("Hello from express");
    });
    app.get("/", Front.docsRequest.bind(Front));
    app.route("/:type(people|organizations|schools)").all(apiReqHandler);
    app.route("/:type(people|organizations|schools)/:id")
        .get(apiReqHandler).patch(apiReqHandler).delete(apiReqHandler);
    app.route("/:type(people|organizations|schools)/:id/:related")
        .get(apiReqHandler);
    app.route("/:type(people|organizations|schools)/:id/relationships/:relationship")
        .get(apiReqHandler).post(apiReqHandler).patch(apiReqHandler);
    app.use(function (req, res, next) {
        Front.sendError({ "message": "Not Found", "status": 404 }, req, res);
    });
    return app;
});
