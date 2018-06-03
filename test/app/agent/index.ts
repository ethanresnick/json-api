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
const agentPromise = appPromise.then(async ({ app }: { app: Application }) => {
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
      request(method, url, opts: { withContentType?: boolean } = {}) {
        const req = superagent[method.toLowerCase()](baseUrl + url)
          .buffer(true);

        if(opts.withContentType) {
          req.type("application/vnd.api+json");
        }

        req.promise = async () => {
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

export default agentPromise;
export type Agent = PromiseResult<typeof agentPromise>;
export type PromiseResult<T> = T extends Promise<infer U> ? U : never;
