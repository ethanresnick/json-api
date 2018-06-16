import express = require("express");
import bodyParser = require("body-parser");
import R = require("ramda");
import API = require("../../../src/index");
import Document from "../../../src/types/Document";
import APIError from "../../../src/types/APIError";
import Query from "../../../src/types/Query/Query";
import FindQuery from "../../../src/types/Query/FindQuery";
import ResourceSet from "../../../src/types/ResourceSet";
import database from "../database/index";
import {
  Identifier,
  FieldExpression
} from '../../../src/steps/pre-query/parse-query-params';
import { RunnableQuery } from "../../../src/steps/run-query";
import { QueryBuildingContext } from "../../../src/controllers/API";
import ExpressStrategy from "../../../src/http-strategies/Express";
import MongooseAdapter from '../../../src/db-adapters/Mongoose/MongooseAdapter';
import { Express } from "express";
export { Express, QueryBuildingContext, ExpressStrategy, MongooseAdapter };

/**
 * Export a promise for the app and the constructed front controller.
 */
export default database.then(function(dbModule) {
  const adapter = new API.dbAdapters.Mongoose(dbModule.models());
  const registry = new API.ResourceTypeRegistry({
    "people": require("./resource-descriptions/people"),
    "organizations": require("./resource-descriptions/organizations"),
    "schools": require("./resource-descriptions/schools")
  }, {
    dbAdapter: adapter
  }, {
    urlTemplates: {
      about: "https://google.com/?x={code}"
    }
  });

  // Initialize the automatic documentation.
  // Note: don't do this til after you've registered all your resources.)
  const Docs = new API.controllers.Documentation(registry, { name: "Example API" });
  const Controller = new API.controllers.API(registry);

  const ControllerWithCustomFilterParsing = new API.controllers.API(registry, {
    filterParser(supportedOperators, rawQuery, params) {
      return ('customNameFilter' in params)
        ? [
            FieldExpression("eq", [
              Identifier("name"),
              String((<any>params).customNameFilter)
            ])
          ]
        : undefined;
    }
  });

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
    Front.customAPIRequest({
      queryTransform: (req, query) =>
        (query as FindQuery).andWhere(
          FieldExpression("nin", [Identifier("gender"), ["male", "female"]])
        )
    })
  );

  // Apply a query transform that returns a custom error
  app.get('/request-that-errors/:type(people)/:id(42)',
    Front.customAPIRequest({
      queryTransform: (query: RunnableQuery) =>
        query.resultsIn(undefined, (error) => ({
          document: new Document({
            errors: [
              // bogus status value, to verify that our
              // custom error's status is being respected.
              new APIError({ status: 499, title: "custom error as string" })
            ]
          })
        }))
    })
  );

  app.get("/request-specific-operators-test", Front.customAPIRequest({
    supportedOperators: {
      ...adapter.constructor.supportedOperators,
      customOp: {
        arity: 2,
        legalIn: ["sort"]
      }
    },
    resultFactory(opts) {
      const sorts = opts.request.queryParams.sort;
      const customOpSorts = sorts && sorts.filter(it => {
        return 'expression' in it && it.expression.operator === 'customOp'
      });

      return {
        status: (customOpSorts && customOpSorts.length > 0) ? 200 : 500
      };
    }
  }));

  app.get('/:type(people)/custom-filter-test/', FrontWithCustomFilterSupport.apiRequest);

  // Apply a query transform that puts all the names in meta
  app.get('/:type(people)/with-names',
    Front.customAPIRequest({
      queryTransform: (query: RunnableQuery) => {
        const origReturning = query.returning;

        return query.resultsIn(
          async (...args) => {
            const origResult = await (origReturning as any)(...args);
            const origDocument = origResult.document as Document;
            const names = (<ResourceSet>origDocument.primary).map(it => it.attrs.name).values;
            origDocument.meta = { ...origDocument.meta, names };
            return origResult;
          },
          error => ({
            document: new Document({})
          })
        );
      }
    })
  );

  // This route creates a custom query that explicitly opts out
  // of the standard `schools` max limit.
  app.get('/:type(schools)/all',
    Front.customAPIRequest({
      queryTransform: (query: Query) => {
        return (query as FindQuery).withLimit(undefined).withoutMaxLimit();
      }
    })
  );

  // This route creates a custom query, but forgets to say that exceeding
  // the max limit is allowed, so it errors.
  app.get('/:type(schools)/custom-illegal-max',
    Front.customAPIRequest({
      queryTransform: (query: Query) => {
        return (query as FindQuery).withLimit(200);
      }
    })
  );

  // Add a route that delegates to next route on 406.
  app.get('/:type(organizations)/no-id/406-delegation-test',
    FrontWith406Delegation.apiRequest,
    (req, res, next) => {
      res.header("Content-Type", "text/plain");
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
        throw new APIError({
          status: 400,
          typeUri: "http://example.com",
          title: "Custom"
        });
      }

      throw new Error("test");
    }
  }));

  // Test already-parsed bodies reaching the express strategy.
  app.post("/parsed/json/:type(organizations)", bodyParser.json({ type: '*/*' }), Front.apiRequest);
  app.post("/parsed/raw/:type(organizations)", bodyParser.raw({ type: '*/*' }), Front.apiRequest)
  app.post("/parsed/text/:type(organizations)", bodyParser.text({ type: '*/*' }), Front.apiRequest)

  // Add a subapp which can hold dynamic routes we add in our tests.
  const subApp: Express = express();
  app.use('/dynamic', subApp);

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
    .get(apiReqHandler).post(apiReqHandler).patch(apiReqHandler).delete(apiReqHandler);


  app.use('/subapp', express().get('/:type(people)', Front.apiRequest));

  app.use(function(req, res, next) {
    Front.sendError({ message: "Not Found", status: 404 }, req, res, next);
  });

  return { app, Front, subApp, adapter };
});

function makeSignInQuery(opts: QueryBuildingContext) {
  const { serverReq } = opts;
  let authHeader = serverReq.headers.authorization;

  if(!authHeader) {
    throw new APIError({ status: 400, title: "Missing user info." });
  }

  authHeader = Array.isArray(authHeader) ? <string>authHeader[0] : authHeader;
  const [user, pass] = Buffer.from(authHeader.substr(6), 'base64').toString().split(':');

  return new FindQuery({
    type: "people",
    isSingular: true,
    filters: [FieldExpression("eq", [Identifier("name"), user])],
    returning({ primary: userData }) {
      if(pass !== 'password') {
        throw new APIError({ status: 401 });
      }

      return {
        // Note lack of beforeRender.
        document: new Document({ primary: ResourceSet.of({ data: userData }) })
      };
    }
  });
}
