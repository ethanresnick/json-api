import express = require("express");
import API = require("../../../src/index");
import database from "../database/index";
import { Express } from "express";
export { Express } from "express";

/**
 * Export a promise for the app.
 */
export default database.then(function(dbModule) {
  const adapter = new API.dbAdapters.Mongoose(dbModule.models());
  const registry = new API.ResourceTypeRegistry({
    "people": require("./resource-descriptions/people"),
    "organizations": require("./resource-descriptions/organizations"),
    "schools": require("./resource-descriptions/schools")
  }, <object>{
    dbAdapter: adapter
  });

  // Initialize the automatic documentation.
  // Note: don't do this til after you've registered all your resources.)
  const Docs = new API.controllers.Documentation(registry, {name: "Example API"});
  const Controller = new API.controllers.API(registry);

  // Initialize the express app + front controller.
  const app: Express = express();

  const port = process.env.PORT || "3000";
  const host = process.env.HOST || "127.0.0.1";
  const Front = new API.httpStrategies.Express(Controller, Docs, { host: host + ":" + port });
  const apiReqHandler = Front.apiRequest.bind(Front);

  // Apply a query transform to a request so we can test query transforms.
  // we'll use them here as a faster alternative to old-style label mappers.
  app.get('/:type(people)/non-binary',
    Front.transformedAPIRequest((req, query) =>
      query.andWhere({field: "gender", operator: "nin", value: ["male", "female"]})));

  // Now, add the routes.
  // Note: below, express incorrectly passes requests using PUT and other
  // unknown methods into the API Controller at some routes. We're doing this
  // here just to test that the controller rejects them properly.
  app.get("/", Front.docsRequest.bind(Front));
  app.route("/:type(people|organizations|schools)").all(apiReqHandler);
  app.route("/:type(people|organizations|schools)/:id")
    .get(apiReqHandler).patch(apiReqHandler).delete(apiReqHandler);
  app.route("/:type(organizations|schools)/:id/:related") // not supported yet.
    .get(apiReqHandler);
  app.route("/:type(people|organizations|schools)/:id/relationships/:relationship")
    .get(apiReqHandler).post(apiReqHandler).patch(apiReqHandler);

  app.use(function(req, res, next) {
    Front.sendError({"message": "Not Found", "status": 404}, req, res);
  });

  return app;
});
