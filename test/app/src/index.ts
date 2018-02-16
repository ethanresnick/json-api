import express = require("express");
import R = require("ramda");
import API = require("../../../src/index");
import Document from "../../../src/types/Document";
import APIError from "../../../src/types/APIError";
import Query from "../../../src/types/Query/Query";
import FindQuery from "../../../src/types/Query/FindQuery";
import ResourceSet from "../../../src/types/ResourceSet";
import database from "../database/index";
import { QueryBuildingContext } from "../../../src/controllers/API";
import { Express } from "express";
export { Express, QueryBuildingContext };

/**
 * Export a promise for the app.
 */
export default database.then(function(dbModule) {
  const adapter = new API.dbAdapters.Mongoose(dbModule.models());
  const registry = new API.ResourceTypeRegistry({
    "people": require("./resource-descriptions/people"),
    "organizations": require("./resource-descriptions/organizations"),
    "schools": require("./resource-descriptions/schools")
  }, {
    dbAdapter: adapter
  });

  // Initialize the automatic documentation.
  // Note: don't do this til after you've registered all your resources.)
  const Docs = new API.controllers.Documentation(registry, { name: "Example API" });
  const Controller = new API.controllers.API(registry);

  const ControllerWithCustomFilterParsing = new API.controllers.API(registry, {
    filterParser: (legalUnary, legalBinary, rawQuery, params) => {
      return ('customNameFilter' in params)
        ? [{
            field: "name",
            operator: "eq",
            value: String((<any>params).customNameFilter)
          }]
        : undefined;
    }
  })

  // Initialize the express app + front controller.
  const app: Express = express();

  const port = process.env.PORT || "3000";
  const host = process.env.HOST || "127.0.0.1";
  const Front = new API.httpStrategies.Express(Controller, Docs, {
    host: host + ":" + port
  });

  const FrontWith406Delegation =
    new API.httpStrategies.Express(Controller, Docs, {
      host: host + ":" + port,
      handleContentNegotiation: false
    });

  const FrontWithCustomFilterSupport =
    new API.httpStrategies.Express(ControllerWithCustomFilterParsing, Docs);

  const apiReqHandler = Front.apiRequest.bind(Front);

  // Apply a query transform to a request so we can test query transforms.
  // we'll use them here as a faster alternative to old-style label mappers.
  app.get('/:type(people)/non-binary',
    Front.transformedAPIRequest((req, query) =>
      (query as FindQuery).andWhere({ field: "gender", operator: "nin", value: ["male", "female"] })));

  // Apply a query transform that returns a custom error
  app.get('/request-that-errors/:type(people)/:id(42)',
    Front.transformedAPIRequest((query: Query) =>
      query.resultsIn(undefined, (error) => ({
        document: new Document({
          errors: [
            // bogus status value, to verify that our
            // custom error's status is being respected.
            new APIError(499, undefined, "custom error as string")
          ]
        })
      }))
    )
  );

  app.get('/:type(people)/custom-filter-test/', FrontWithCustomFilterSupport.apiRequest);

  // Apply a query transform that puts all the names in meta
  app.get('/:type(people)/with-names',
    Front.transformedAPIRequest((query: Query) => {
      const origReturning = query.returning;

      return query.resultsIn(async (...args) => {
        const origResult = await (origReturning as any)(...args);
        const origDocument = origResult.document as Document;
        const names = (<ResourceSet>origDocument.primary).map(it => it.attrs.name).values;
        origDocument.meta = { ...origDocument.meta, names };
        return origResult;
      }, (error) => ({
        document: new Document({})
      }))
    })
  );

  // Add a route that delegates to next route on 406.
  app.get('/:type(organizations)/no-id/406-delegation-test',
    FrontWith406Delegation.apiRequest,
    (req, res, next) => {
      res.header('Content-Type', 'text/plain')
      res.send("Hello from express");
    })

  app.get('/hardcoded-result', R.partial(
    Front.sendResult, [{
      status: 201,
      document: new Document({ meta: { "hardcoded result": true } })
    }]
  ));

  app.post('/sign-in', Front.customAPIRequest({ queryFactory: makeSignInQuery }));

  app.post('/sign-in/with-before-render', Front.customAPIRequest({
    queryFactory: (opts) => {
      const signInQuery = makeSignInQuery(opts);

      return signInQuery.resultsIn(
        R.pipe(signInQuery.returning, async (origResultPromise) => {
          const origResult = await origResultPromise;

          if(origResult.document) {
            origResult.document =
              await opts.transformDocument(origResult.document, 'beforeRender');
          }

          return origResult;
        })
      );
    }
  }));

  app.get('/with-error', Front.customAPIRequest({
    queryFactory: ({ request }) => {
      if(request.queryParams.customError) {
        throw new APIError(400, undefined, "Custom");
      }

      throw new Error("test");
    }
  }));

  // Now, add the routes.
  // Note: below, express incorrectly passes requests using PUT and other
  // unknown methods into the API Controller at some routes. We're doing this
  // here just to test that the controller rejects them properly.
  app.get("/", Front.docsRequest);
  app.route("/:type(people|organizations|schools)").all(Front.apiRequest);
  app.route("/:type(people|organizations|schools)/:id")
    .get(apiReqHandler).patch(apiReqHandler).delete(apiReqHandler);
  app.route("/:type(organizations|schools)/:id/:related") // not supported yet.
    .get(apiReqHandler);
  app.route("/:type(people|organizations|schools)/:id/relationships/:relationship")
    .get(apiReqHandler).post(apiReqHandler).patch(apiReqHandler);

  app.use(function(req, res, next) {
    Front.sendError({ "message": "Not Found", "status": 404 }, req, res, next);
  });

  return app;
});

function makeSignInQuery(opts: QueryBuildingContext) {
  const { serverReq } = opts;
  let authHeader = serverReq.headers.authorization;

  if(!authHeader) {
    throw new APIError({ status: 400, title: "Missing user info." });
  }

  authHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const [user, pass] = Buffer.from(authHeader.substr(6), 'base64').toString().split(':');

  return new FindQuery({
    type: "people",
    singular: true,
    filters: [{ field: "name", operator: "eq", value: user }],
    returning: ([userData]) => {
      if(pass !== 'password') {
        throw new APIError(401);
      }

      return {
        // Note lack of beforeRender.
        document: new Document({ primary: ResourceSet.of({ data: userData }) })
      }
    }
  });
}
