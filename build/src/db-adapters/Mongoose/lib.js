"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = require("../../types/APIError");
function errorHandler(err) {
    const errors = [];
    if (err.errors) {
        for (const errKey in err.errors) {
            const thisError = err.errors[errKey];
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
    const paths = [];
    model.schema.eachPath((name, type) => {
        if (isReferencePath(type))
            paths.push(name);
    });
    return paths;
}
exports.getReferencePaths = getReferencePaths;
function isReferencePath(schemaType) {
    const options = (schemaType.caster || schemaType).options;
    return options && options.ref !== undefined;
}
exports.isReferencePath = isReferencePath;
function getReferencedModelName(model, path) {
    const schemaType = model.schema.path(path);
    const schemaOptions = (schemaType.caster || schemaType).options;
    return schemaOptions && schemaOptions.ref;
}
exports.getReferencedModelName = getReferencedModelName;
function resourceToDocObject(resource) {
    const res = Object.assign({}, resource.attrs);
    const getId = (it) => it.id;
    for (const key in resource.relationships) {
        const linkage = resource.relationships[key].linkage.value;
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
