import express from "express";
import API from "../../../../index";
import database from "../database/index";

/**
 * Export a promise for the app.
 */
export default database.then(function(dbModule) {
  const adapter = new API.dbAdapters.Mongoose(dbModule.models())
    , registry = new API.ResourceTypeRegistry()
    , Controller = new API.controllers.API(registry);

  ["people", "organizations", "schools"].forEach(function(resourceType) {
    const description = require("./resource-descriptions/" + resourceType);
    description.dbAdapter = adapter;
    registry.type(resourceType, description);
  });

  // Initialize the automatic documentation.
  // Note: don't do this til after you've registered all your resources.)
  const Docs = new API.controllers.Documentation(registry, {name: "Example API"});

  // Initialize the express app + front controller.
  const app = express();

  const Front = new API.httpStrategies.Express(Controller, Docs);
  const apiReqHandler = Front.apiRequest.bind(Front);

  // Now, add the routes.
  // To do this in a more scalable and configurable way, check out
  // http://github.com/ethanresnick/express-simple-router. To protect some
  // routes, check out http://github.com/ethanresnick/express-simple-firewall.
  app.get("/", Front.docsRequest.bind(Front));
  app.route("/:type(people|organizations|schools)")
    .get(apiReqHandler).post(apiReqHandler).patch(apiReqHandler);
  app.route("/:type(people|organizations|schools)/:id")
    .get(apiReqHandler).patch(apiReqHandler).delete(apiReqHandler);
  app.route("/:type(people|organizations|schools)/:id/:related")
    .get(apiReqHandler);
  app.route("/:type(people|organizations|schools)/:id/relationships/:relationship")
    .get(apiReqHandler).post(apiReqHandler).patch(apiReqHandler);

  app.use(function(req, res, next) {
    Front.sendError({"message": "Not Found", "status": 404}, req, res);
  });

  return app;
});
