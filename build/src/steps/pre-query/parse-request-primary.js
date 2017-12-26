"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
const Resource_1 = require("../../types/Resource");
const ResourceIdentifier_1 = require("../../types/ResourceIdentifier");
const Relationship_1 = require("../../types/Relationship");
const Data_1 = require("../../types/Data");
function default_1(jsonData, parseAsLinkage = false) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return parseAsLinkage
                ? Data_1.default.fromJSON(jsonData).map(toResourceIdentifier)
                : Data_1.default.fromJSON(jsonData).map(toResource);
        }
        catch (error) {
            if (error instanceof APIError_1.default) {
                throw error;
            }
            else {
                const title = "The resources you provided could not be parsed.";
                const details = `The precise error was: "${error.message}".`;
                throw new APIError_1.default(400, undefined, title, details);
            }
        }
    });
}
exports.default = default_1;
function toResourceIdentifier(json) {
    return new ResourceIdentifier_1.default(json);
}
function toResource(json) {
    const relationships = json.relationships || {};
    for (let key in relationships) {
        if (typeof relationships[key].data === 'undefined') {
            throw new APIError_1.default(400, undefined, `Missing relationship linkage.`, `No data was found for the ${key} relationship.`);
        }
        relationships[key] = Relationship_1.default.of({
            data: relationships[key].data,
            owner: { type: json.type, id: json.id, path: key }
        }).map(toResourceIdentifier);
    }
    return new Resource_1.default(json.type, json.id, json.attributes, relationships, json.meta);
}
