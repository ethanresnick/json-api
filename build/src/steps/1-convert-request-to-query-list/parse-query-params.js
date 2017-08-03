"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const R = require("ramda");
const APIError_1 = require("../../types/APIError");
function default_1(request) {
    return Promise.resolve().then(() => {
        const parseFieldsParam = R.map(R.pipe(parseCommaSeparatedParamString, R.filter(isField)));
        const paramValidatorAndParserFns = {
            include: [R.is(String), parseCommaSeparatedParamString],
            sort: [R.is(String), parseCommaSeparatedParamString],
            page: [isScopedParam, R.identity],
            filter: [isScopedParam, R.identity],
            fields: [isScopedParam, parseFieldsParam],
        };
        return R.mapObjIndexed((v, paramName) => {
            if (!R.has(paramName, paramValidatorAndParserFns)) {
                return v;
            }
            const [validator, parser] = paramValidatorAndParserFns[paramName];
            if (!validator(v)) {
                throw new APIError_1.default(400, undefined, "Invalid parameter value.");
            }
            return parser(v);
        }, request.uri.queryParams);
    });
}
exports.default = default_1;
const isField = (it) => !["id", "type"].includes(it);
const isScopedParam = R.is(Object);
const parseCommaSeparatedParamString = (encodedString) => {
    if (typeof encodedString !== 'string') {
        throw new Error("Expected string value parameter");
    }
    return encodedString.split(',').map(decodeURIComponent);
};
