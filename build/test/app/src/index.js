"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const API = require("../../../src/index");
const Document_1 = require("../../../src/types/Document");
const APIError_1 = require("../../../src/types/APIError");
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
    const ControllerWithCustomFilterParsing = new API.controllers.API(registry, {
        filterParser: (legalUnary, legalBinary, rawQuery, params) => {
            return ('customNameFilter' in params)
                ? [{
                        field: "name",
                        operator: "eq",
                        value: String(params.customNameFilter)
                    }]
                : undefined;
        }
    });
    const app = express();
    const port = process.env.PORT || "3000";
    const host = process.env.HOST || "127.0.0.1";
    const Front = new API.httpStrategies.Express(Controller, Docs, {
        host: host + ":" + port
    });
    const FrontWith406Delegation = new API.httpStrategies.Express(Controller, Docs, {
        host: host + ":" + port,
        handleContentNegotiation: false
    });
    const FrontWithCustomFilterSupport = new API.httpStrategies.Express(ControllerWithCustomFilterParsing, Docs);
    const apiReqHandler = Front.apiRequest.bind(Front);
    app.get('/:type(people)/non-binary', Front.transformedAPIRequest((req, query) => query.andWhere({ field: "gender", operator: "nin", value: ["male", "female"] })));
    app.get('/request-that-errors/:type(people)/:id(42)', Front.transformedAPIRequest((query) => query.resultsIn(undefined, (error) => ({
        document: new Document_1.default({
            errors: [
                new APIError_1.default(499, undefined, "custom error as string")
            ]
        })
    }))));
    app.get('/:type(people)/custom-filter-test/', FrontWithCustomFilterSupport.apiRequest.bind(FrontWithCustomFilterSupport));
    app.get('/:type(people)/with-names', Front.transformedAPIRequest((query) => {
        const origReturning = query.returning;
        return query.resultsIn((...args) => {
            const origResult = origReturning(...args);
            const origDocument = origResult.document;
            const names = origDocument.primary.map(it => it.attrs.name).values;
            origDocument.meta = Object.assign({}, origDocument.meta, { names });
            return origResult;
        }, (error) => ({
            document: new Document_1.default({})
        }));
    }));
    app.get('/:type(organizations)/no-id/406-delegation-test', FrontWith406Delegation.apiRequest.bind(FrontWith406Delegation), (req, res, next) => {
        res.header('Content-Type', 'text/plain');
        res.send("Hello from express");
    });
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
