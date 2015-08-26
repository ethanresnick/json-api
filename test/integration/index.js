process.env.TESTING = true;

import Q from "q";
Q.longStackSupport = true;

import {expect} from "chai";
import Agent from "../app/agent";
import Db from "../app/database";


before((done) => {
  Db.then((module) => {
    module.fixturesReset().then((data) => {
      // Trigger other tests.
      // Note: we must load these after the fixtures finish, since even
      // _describing_ the require()d tests needs the fixtures: the App
      // requests come before describe the describe calls, and those
      // requests will fail if the fixtures aren't in place.
      require("./http-compliance");
      require("./content-negotiation");
      require("./fetch-collection");
      require("./create-resource");
      done();
    }).done();
  });
});


