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
function toMongoCriteria(constraintOrPredicate) {
    const mongoOperator = "$" +
        (constraintOrPredicate.operator === 'neq'
            ? 'ne'
            : constraintOrPredicate.operator);
    const mongoField = (constraintOrPredicate.field === 'id'
        ? '_id'
        : constraintOrPredicate.field);
    switch (constraintOrPredicate.operator) {
        case "and":
        case "or":
            return !constraintOrPredicate.value.length
                ? {}
                : {
                    [mongoOperator]: constraintOrPredicate.value.map(toMongoCriteria)
                };
        case "eq":
            return { [mongoField]: constraintOrPredicate.value };
        default:
            return {
                [mongoField]: {
                    [mongoOperator]: constraintOrPredicate.value
                }
            };
    }
}
exports.toMongoCriteria = toMongoCriteria;
function resourceToDocObject(resource) {
    const res = Object.assign({}, resource.attrs);
    for (const key in resource.relationships) {
        res[key] = resource.relationships[key].unwrapDataWith(it => it.id);
    }
    return res;
}
exports.resourceToDocObject = resourceToDocObject;
