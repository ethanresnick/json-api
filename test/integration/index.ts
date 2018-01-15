import Db from "../app/database";

before(() => {
  return Db.then((module) => {
    return module.fixturesReset().then((data) => {
      // Trigger other tests.
      // Note: we must load these after the fixtures finish, since even
      // _describing_ the require()d tests needs the fixtures: the App
      // requests come before describe the describe calls, and those
      // requests will fail if the fixtures aren't in place.
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
  })
});
