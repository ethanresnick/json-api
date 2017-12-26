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
const Data_1 = require("../types/Data");
const Resource_1 = require("../types/Resource");
const ResourceIdentifier_1 = require("../types/ResourceIdentifier");
function transform(toTransform, mode, extras) {
    const { registry } = extras;
    const skipTransform = (it, typeForTransform) => it instanceof ResourceIdentifier_1.default && !registry.transformLinkage(typeForTransform);
    const linkageTransformEnabled = registry.typeNames().some(it => registry.transformLinkage(it));
    const superFn = (it, req, res, extras) => {
        const parentType = registry.parentType(it.type);
        const parentTransform = parentType && registry[mode](parentType);
        if (!parentType || !parentTransform || skipTransform(it, parentType)) {
            return it;
        }
        return parentTransform(it, req, res, superFn, extras);
    };
    return toTransform.flatMapAsync(function (it) {
        return __awaiter(this, void 0, void 0, function* () {
            if (skipTransform(it, it.type)) {
                return Data_1.default.pure(it);
            }
            if (linkageTransformEnabled && it instanceof Resource_1.default) {
                for (let relationshipName in it.relationships) {
                    const relationship = it.relationships[relationshipName];
                    it.relationships[relationshipName] = yield relationship.flatMapAsync(linkage => {
                        return transform(Data_1.default.pure(linkage), mode, extras);
                    });
                }
            }
            const transformFn = registry[mode](it.type);
            if (!transformFn) {
                return Data_1.default.pure(it);
            }
            const transformed = yield transformFn(it, extras.frameworkReq, extras.frameworkRes, superFn, extras);
            return transformed === undefined
                ? Data_1.default.empty
                : Data_1.default.pure(transformed);
        });
    });
}
exports.default = transform;
