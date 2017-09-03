"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(type, labelOrId, registry, frameworkReq) {
    return Promise.resolve().then(() => {
        const adapter = registry.dbAdapter(type);
        const model = adapter.getModel(adapter.constructor.getModelName(type));
        const labelMappers = registry.labelMappers(type);
        const labelMapper = labelMappers && labelMappers[labelOrId];
        return (typeof labelMapper === "function")
            ? labelMapper(model, frameworkReq)
            : labelOrId;
    });
}
exports.default = default_1;
