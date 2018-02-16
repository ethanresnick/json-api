import superagent = require("superagent");
import { Response } from "superagent";
import appPromise from "../src/index";
import { Application } from "express";

/* tslint:disable no-unbound-method */
const JSONAPIContentType = "application/vnd.api+json";
superagent.serialize[JSONAPIContentType] = JSON.stringify;
superagent.parse[JSONAPIContentType] = superagent.parse["application/json"];
/* tslint:enable no-unbound-method */

/**
 * Export a Promise for a module that can make requests to the app.
 */
export default appPromise.then(function(app: Application) {
  const port = process.env.PORT || "3000";
  const host = process.env.HOST || "127.0.0.1";
  const baseUrl = "http://" + host + ":" + port;

  const appListenPromise = new Promise<void>((resolve, reject) => {
    app.listen(Number(port), host, function(err) {
      if(err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  return appListenPromise.then(() => {
    return {
      request(method, url) {
        const req = superagent[method.toLowerCase()](baseUrl + url).buffer(true);
        req.promise = () => {
          return new Promise<Response>((resolveInner, rejectInner) => {
            req.end((err, res) => {
              if(err) {
                rejectInner(err);
              } else {
                resolveInner(res);
              }
            });
          });
        };
        return req;
      },
      superagent,
      baseUrl
    };
  });
});
