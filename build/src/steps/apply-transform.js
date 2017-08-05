"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Resource_1 = require("../types/Resource");
const Collection_1 = require("../types/Collection");
function default_1(toTransform, mode, registry, frameworkReq, frameworkRes) {
    if (toTransform instanceof Resource_1.default) {
        return transform(toTransform, frameworkReq, frameworkRes, mode, registry);
    }
    else if (toTransform instanceof Collection_1.default) {
        return Promise.all(toTransform.resources.map((it) => transform(it, frameworkReq, frameworkRes, mode, registry))).then((transformed) => {
            const resources = transformed.filter((it) => it !== undefined);
            return new Collection_1.default(resources);
        });
    }
    else {
        return Promise.resolve(toTransform);
    }
}
exports.default = default_1;
function transform(resource, req, res, transformMode, registry) {
    const transformFn = registry[transformMode](resource.type);
    const superFn = (resource, req, res) => {
        const parentType = registry.parentType(resource.type);
        if (!parentType || !registry[transformMode](parentType)) {
            return resource;
        }
        else {
            return registry[transformMode](parentType)(resource, req, res, superFn);
        }
    };
    if (!transformFn) {
        return Promise.resolve(resource);
    }
    const transformed = transformFn(resource, req, res, superFn);
    return Promise.resolve(transformed);
}
