import Q from "q";
import superagent from "superagent";
import app from "../src/index";

const JSONAPIContentType = 'application/vnd.api+json';
superagent.serialize[JSONAPIContentType] = JSON.stringify;
superagent.parse[JSONAPIContentType] = superagent.parse['application/json'];

/**
 * Export a Promise for a module that can make requests to the app.
 */
export default app.then(function(app) {
  const port = process.env.PORT || '3000';
  const host = process.env.HOST || '127.0.0.1';

  app.baseUrl = 'http://' + host + ':' + port;

  return Q.Promise((resolve, reject) => {
    app.listen(port, host, () => {
      resolve({
        request(method, url) {
          var req = superagent[method.toLowerCase()](app.baseUrl + url).buffer(true);
          req.promise = () => Q.npost(req, "end", []);
          return req;
        },
        superagent: superagent
      });
    });
  })
});
