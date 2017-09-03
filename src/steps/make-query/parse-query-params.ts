import R = require("ramda");
import { isValidMemberName } from "../../util/json-api";
import { stripLeadingBMPChar } from "../../util/misc";
import { Sort } from '../../types/index';
import APIError from "../../types/APIError";
import parseFilterParam from "./filter-parser";
import { FieldConstraint, Predicate, BinaryOpts, UnaryOpts } from "../../types/index";

// the shape of values in req.queryParams, pre + post parsing.
export type StringListParam = string[];
export type ScopedParam = { [scopeName: string]: any };
export type ScopedStringListParam = { [scopeName: string]: string[] };

export type RawParams = {
  [paramName: string]: any
};

export type ParsedQueryParams = {
  include?: StringListParam;
  sort?: Sort[];
  page?: ScopedParam;
  filter?: (FieldConstraint | Predicate)[];
  fields?: ScopedStringListParam;
}

export default function(params: RawParams): ParsedQueryParams {
  const paramsToParserFns = {
    include: parseCommaSeparatedParamString,
    sort: R.pipe(parseCommaSeparatedParamString, R.map(parseSortField)),
    page: R.pipe(parseScopedParam, R.map((it: any) => parseInt(String(it), 10))),
    filter: parseFilterParam.bind(null, UnaryOpts, BinaryOpts),
    fields: parseFieldsParam
  };

  if(params.filter && typeof params.filter !== 'string') {
    throw new Error(
      `Expected filter params to be an unparsed string at this point.
       Check if you're using the old object format, which would've been parsed earlier by qs.`
    );
  }

  return R.mapObjIndexed((v: any, paramName: string) => {
    return (!R.has(paramName, paramsToParserFns))
      ? v
      : paramsToParserFns[paramName](v)
  }, params);
}

const isScopedParam = R.is(Object);
const isValidFieldName = R.allPass([
  (it: string) => !["id", "type"].includes(it),
  isValidMemberName
]);

function parseFieldsParam(fieldsParam: ScopedParam) {
  if(!isScopedParam(fieldsParam))
    throw new APIError(400, undefined, "Invalid parameter value.");

  return R.map<ScopedParam, ScopedStringListParam>(
    R.pipe(parseCommaSeparatedParamString, R.filter(isValidFieldName)),
    fieldsParam
  );
}

function parseScopedParam(scopedParam: ScopedParam) {
  if(!isScopedParam(scopedParam))
    throw new APIError(400, undefined, "Invalid parameter value.");

  return scopedParam;
}

function parseCommaSeparatedParamString(encodedString: string) {
  if(typeof encodedString !== 'string')
    throw new Error("Expected string value parameter");

  return encodedString.split(',').map(decodeURIComponent)
}

function parseSortField(sortField: string): Sort {
  const fieldName = stripLeadingBMPChar('-')(sortField);

  if(!isValidMemberName(fieldName)) {
    throw new APIError(400, undefined, `Tried to sort on illegal field name ${fieldName}.`);
  }

  return {
    field: fieldName,
    direction: sortField.startsWith('-') ? 'DESC' : 'ASC'
  };
};
