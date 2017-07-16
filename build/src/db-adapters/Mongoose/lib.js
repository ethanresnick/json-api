"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
function errorHandler(err) {
    const errors = [];
    if (err.errors) {
        for (let errKey in err.errors) {
            let thisError = err.errors[errKey];
            errors.push(new APIError_1.default((err.name === "ValidationError") ? 400 : (thisError.status || 500), undefined, thisError.message, undefined, undefined, (thisError.path) ? [thisError.path] : undefined));
        }
    }
    else {
        errors.push(err);
    }
    throw errors;
}
exports.errorHandler = errorHandler;
function getReferencePaths(model) {
    let paths = [];
    model.schema.eachPath((name, type) => {
        if (isReferencePath(type))
            paths.push(name);
    });
    return paths;
}
exports.getReferencePaths = getReferencePaths;
function isReferencePath(schemaType) {
    let options = (schemaType.caster || schemaType).options;
    return options && options.ref !== undefined;
}
exports.isReferencePath = isReferencePath;
function getReferencedModelName(model, path) {
    let schemaType = model.schema.path(path);
    let schemaOptions = (schemaType.caster || schemaType).options;
    return schemaOptions && schemaOptions.ref;
}
exports.getReferencedModelName = getReferencedModelName;
function resourceToDocObject(resource) {
    let res = Object.assign({}, resource.attrs);
    let getId = (it) => it.id;
    for (let key in resource.relationships) {
        let linkage = resource.relationships[key].linkage.value;
        if (linkage === null || (Array.isArray(linkage) && linkage.length === 0)) {
            res[key] = linkage;
        }
        else {
            res[key] = Array.isArray(linkage) ? linkage.map(getId) : linkage.id;
        }
    }
    return res;
}
exports.resourceToDocObject = resourceToDocObject;
