"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const R = require("ramda");
const API = require("../../../src/index");
const Document_1 = require("../../../src/types/Document");
const APIError_1 = require("../../../src/types/APIError");
const FindQuery_1 = require("../../../src/types/Query/FindQuery");
const ResourceSet_1 = require("../../../src/types/ResourceSet");
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
    app.get('/:type(people)/custom-filter-test/', FrontWithCustomFilterSupport.apiRequest);
    app.get('/:type(people)/with-names', Front.transformedAPIRequest((query) => {
        const origReturning = query.returning;
        return query.resultsIn((...args) => __awaiter(this, void 0, void 0, function* () {
            const origResult = yield origReturning(...args);
            const origDocument = origResult.document;
            const names = origDocument.primary.map(it => it.attrs.name).values;
            origDocument.meta = Object.assign({}, origDocument.meta, { names });
            return origResult;
        }), (error) => ({
            document: new Document_1.default({})
        }));
    }));
    app.get('/:type(organizations)/no-id/406-delegation-test', FrontWith406Delegation.apiRequest, (req, res, next) => {
        res.header('Content-Type', 'text/plain');
        res.send("Hello from express");
    });
    app.get('/hardcoded-result', R.partial(Front.sendResult, [{
            status: 201,
            document: new Document_1.default({ meta: { "hardcoded result": true } })
        }]));
    app.post('/sign-in', Front.customAPIRequest({ queryFactory: makeSignInQuery }));
    app.post('/sign-in/with-before-render', Front.customAPIRequest({
        queryFactory: (opts) => {
            const signInQuery = makeSignInQuery(opts);
            return signInQuery.resultsIn(R.pipe(signInQuery.returning, (origResultPromise) => __awaiter(this, void 0, void 0, function* () {
                const origResult = yield origResultPromise;
                if (origResult.document) {
                    origResult.document =
                        yield opts.transformDocument(origResult.document, 'beforeRender');
                }
                return origResult;
            })));
        }
    }));
    app.get("/", Front.docsRequest);
    app.route("/:type(people|organizations|schools)").all(Front.apiRequest);
    app.route("/:type(people|organizations|schools)/:id")
        .get(apiReqHandler).patch(apiReqHandler).delete(apiReqHandler);
    app.route("/:type(organizations|schools)/:id/:related")
        .get(apiReqHandler);
    app.route("/:type(people|organizations|schools)/:id/relationships/:relationship")
        .get(apiReqHandler).post(apiReqHandler).patch(apiReqHandler);
    app.use(function (req, res, next) {
        Front.sendError({ "message": "Not Found", "status": 404 }, req, res, next);
    });
    return app;
});
function makeSignInQuery(opts) {
    const { serverReq } = opts;
    let authHeader = serverReq.headers.authorization;
    if (!authHeader) {
        throw new APIError_1.default({ status: 400, title: "Missing user info." });
    }
    authHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const [user, pass] = Buffer.from(authHeader.substr(6), 'base64').toString().split(':');
    return new FindQuery_1.default({
        type: "people",
        singular: true,
        filters: [{ field: "name", operator: "eq", value: user }],
        returning: ([userData]) => {
            if (pass !== 'password') {
                throw new APIError_1.default(401);
            }
            return {
                document: new Document_1.default({ primary: ResourceSet_1.default.of({ data: userData }) })
            };
        }
    });
}
