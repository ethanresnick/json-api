"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Resource_1 = require("../types/Resource");
const Collection_1 = require("../types/Collection");
function default_1(toTransform, mode, registry, extras) {
    if (toTransform instanceof Resource_1.default) {
        return transform(toTransform, mode, registry, extras);
    }
    else if (toTransform instanceof Collection_1.default) {
        return Promise.all(toTransform.resources.map((it) => transform(it, mode, registry, extras))).then((transformed) => {
            const resources = transformed.filter((it) => it !== undefined);
            return new Collection_1.default(resources);
        });
    }
    else {
        return Promise.resolve(toTransform);
    }
}
exports.default = default_1;
function transform(resource, transformMode, registry, extras) {
    const transformFn = registry[transformMode](resource.type);
    const superFn = (resource, req, res, extras) => {
        const parentType = registry.parentType(resource.type);
        if (!parentType || !registry[transformMode](parentType)) {
            return resource;
        }
        else {
            return registry[transformMode](parentType)(resource, req, res, superFn, extras);
        }
    };
    if (!transformFn) {
        return Promise.resolve(resource);
    }
    const transformed = transformFn(resource, extras.frameworkReq, extras.frameworkRes, superFn, extras);
    return Promise.resolve(transformed);
}
