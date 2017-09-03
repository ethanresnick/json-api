"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const R = require("ramda");
const json_api_1 = require("../../util/json-api");
const misc_1 = require("../../util/misc");
const APIError_1 = require("../../types/APIError");
const filter_parser_1 = require("./filter-parser");
const index_1 = require("../../types/index");
function default_1(params) {
    const paramsToParserFns = {
        include: parseCommaSeparatedParamString,
        sort: R.pipe(parseCommaSeparatedParamString, R.map(parseSortField)),
        page: R.pipe(parseScopedParam, R.map((it) => parseInt(String(it), 10))),
        filter: filter_parser_1.default.bind(null, index_1.UnaryOpts, index_1.BinaryOpts),
        fields: parseFieldsParam
    };
    if (params.filter && typeof params.filter !== 'string') {
        throw new Error(`Expected filter params to be an unparsed string at this point.
       Check if you're using the old object format, which would've been parsed earlier by qs.`);
    }
    return R.mapObjIndexed((v, paramName) => {
        return (!R.has(paramName, paramsToParserFns))
            ? v
            : paramsToParserFns[paramName](v);
    }, params);
}
exports.default = default_1;
const isScopedParam = R.is(Object);
const isValidFieldName = R.allPass([
    (it) => !["id", "type"].includes(it),
    json_api_1.isValidMemberName
]);
function parseFieldsParam(fieldsParam) {
    if (!isScopedParam(fieldsParam))
        throw new APIError_1.default(400, undefined, "Invalid parameter value.");
    return R.map(R.pipe(parseCommaSeparatedParamString, R.filter(isValidFieldName)), fieldsParam);
}
function parseScopedParam(scopedParam) {
    if (!isScopedParam(scopedParam))
        throw new APIError_1.default(400, undefined, "Invalid parameter value.");
    return scopedParam;
}
function parseCommaSeparatedParamString(encodedString) {
    if (typeof encodedString !== 'string')
        throw new Error("Expected string value parameter");
    return encodedString.split(',').map(decodeURIComponent);
}
function parseSortField(sortField) {
    const fieldName = misc_1.stripLeadingBMPChar('-')(sortField);
    if (!json_api_1.isValidMemberName(fieldName)) {
        throw new APIError_1.default(400, undefined, `Tried to sort on illegal field name ${fieldName}.`);
    }
    return {
        field: fieldName,
        direction: sortField.startsWith('-') ? 'DESC' : 'ASC'
    };
}
;
