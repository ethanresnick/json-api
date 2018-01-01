"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const superagent = require("superagent");
const index_1 = require("../src/index");
const JSONAPIContentType = "application/vnd.api+json";
superagent.serialize[JSONAPIContentType] = JSON.stringify;
superagent.parse[JSONAPIContentType] = superagent.parse["application/json"];
exports.default = index_1.default.then(function (app) {
    const port = process.env.PORT || "3000";
    const host = process.env.HOST || "127.0.0.1";
    const baseUrl = "http://" + host + ":" + port;
    const appListenPromise = new Promise((resolve, reject) => {
        app.listen(Number(port), host, function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
    return appListenPromise.then(() => {
        return {
            request(method, url) {
                const req = superagent[method.toLowerCase()](baseUrl + url).buffer(true);
                req.promise = () => {
                    return new Promise((resolveInner, rejectInner) => {
                        req.end((err, res) => {
                            if (err) {
                                rejectInner(err);
                            }
                            else {
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
