import superagent = require("superagent");
import appPromise from "../src/index";
import { Application } from "express";

const JSONAPIContentType = "application/vnd.api+json";
superagent.serialize[JSONAPIContentType] = JSON.stringify;
superagent.parse[JSONAPIContentType] = superagent.parse["application/json"];

/**
 * Export a Promise for a module that can make requests to the app.
 */
export default appPromise.then(function(app: Application) {
  const port = process.env.PORT || "3000";
  const host = process.env.HOST || "127.0.0.1";
  const baseUrl = "http://" + host + ":" + port;

  const appListenPromise = new Promise((resolve, reject) => {
    app.listen(Number(port), host, function(err) {
      err ? reject(err) : resolve();
    });
  });

  return appListenPromise.then((app: any) => {
    return {
      request(method, url) {
        const req = superagent[method.toLowerCase()](baseUrl + url).buffer(true);
        req.promise = () => {
          return new Promise((resolveInner, rejectInner) =>
            req.end((err, res) => err ? rejectInner(err) : resolveInner(res))
          );
        };
        return req;
      },
      superagent,
      baseUrl
    };
  });
});
