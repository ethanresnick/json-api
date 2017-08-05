"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const APIError_1 = require("../../types/APIError");
const Resource_1 = require("../../types/Resource");
const Relationship_1 = require("../../types/Relationship");
const Linkage_1 = require("../../types/Linkage");
const Collection_1 = require("../../types/Collection");
function default_1(data, parseAsLinkage = false) {
    return Q.Promise(function (resolve, reject) {
        try {
            if (parseAsLinkage) {
                resolve(linkageFromJSON(data));
            }
            else if (Array.isArray(data)) {
                resolve(new Collection_1.default(data.map(resourceFromJSON)));
            }
            else {
                resolve(resourceFromJSON(data));
            }
        }
        catch (error) {
            if (error instanceof APIError_1.default) {
                reject(error);
            }
            else {
                const title = "The resources you provided could not be parsed.";
                const details = `The precise error was: "${error.message}".`;
                reject(new APIError_1.default(400, undefined, title, details));
            }
        }
    });
}
exports.default = default_1;
function relationshipFromJSON(json) {
    if (typeof json.data === "undefined") {
        throw new APIError_1.default(400, undefined, `Missing relationship linkage.`);
    }
    return new Relationship_1.default(linkageFromJSON(json.data));
}
function linkageFromJSON(json) {
    return new Linkage_1.default(json);
}
function resourceFromJSON(json) {
    const relationships = json.relationships || {};
    let key;
    try {
        for (key in relationships) {
            relationships[key] = relationshipFromJSON(relationships[key]);
        }
    }
    catch (e) {
        e.details = `No data was found for the ${key} relationship.`;
        throw e;
    }
    return new Resource_1.default(json.type, json.id, json.attributes, relationships, json.meta);
}
