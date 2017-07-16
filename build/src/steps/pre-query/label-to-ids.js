"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
function default_1(type, labelOrId, registry, frameworkReq) {
    return Q.Promise(function (resolve, reject) {
        let adapter = registry.dbAdapter(type);
        let model = adapter.getModel(adapter.constructor.getModelName(type));
        let labelMappers = registry.labelMappers(type);
        let labelMapper = labelMappers && labelMappers[labelOrId];
        if (typeof labelMapper === "function") {
            Q(labelMapper(model, frameworkReq)).then(resolve, reject);
        }
        else {
            resolve(labelOrId);
        }
    });
}
exports.default = default_1;
