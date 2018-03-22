import R = require("ramda");
import * as Errors from '../../util/errors';
import { isValidMemberName } from "../../util/json-api";
import { stripLeadingBMPChar } from "../../util/misc";
import { Sort } from "../../types/index";

// the shape of values in req.queryParams, pre + post parsing.
export type StringListParam = string[];
export type ScopedParam = { [scopeName: string]: any };
export type ScopedStringListParam = { [scopeName: string]: string[] };

export type RawParams = {
  [paramName: string]: any;
};

export type ParsedQueryParams = {
  include?: StringListParam;
  sort?: Sort[];
  page?: ScopedParam;
  fields?: ScopedStringListParam;
  [paramName: string]: any;
};

export default function(params: RawParams): ParsedQueryParams {
  const paramsToParserFns = {
    include: parseCommaSeparatedParamString,
    sort: R.pipe(parseCommaSeparatedParamString, R.map(parseSortField)),
    page: R.pipe(
      parseScopedParam,
      R.map<ScopedParam, ScopedParam>((it: any) => parseInt(String(it), 10))
    ),
    fields: parseFieldsParam
  };

  return R.mapObjIndexed((v: any, paramName: string) => {
    return !R.has(paramName, paramsToParserFns)
      ? v
      : paramsToParserFns[paramName](v);
  }, params);
}

const isScopedParam = R.is(Object);
const isValidFieldName = R.allPass([
  (it: string) => !["id", "type"].includes(it),
  isValidMemberName
]);

function parseFieldsParam(fieldsParam: ScopedParam) {
  if(!isScopedParam(fieldsParam))
    throw Errors.invalidQueryParamValue();

  return R.map<ScopedParam, ScopedStringListParam>(
    R.pipe(
      parseCommaSeparatedParamString,
      <(it: string[]) => string[]>R.filter(isValidFieldName)
    ),
    fieldsParam
  );
}

function parseScopedParam(scopedParam: ScopedParam) {
  if(!isScopedParam(scopedParam))
    throw Errors.invalidQueryParamValue();

  return scopedParam;
}

function parseCommaSeparatedParamString(encodedString: string) {
  if(typeof encodedString !== 'string')
    throw Errors.invalidQueryParamValue({
      detail: "Expected a comma-separated list of strings."
    });

  return encodedString.split(",").map(decodeURIComponent);
}

function parseSortField(sortField: string): Sort {
  const fieldName = stripLeadingBMPChar("-")(sortField);

  if(!isValidMemberName(fieldName)) {
    throw Errors.invalidQueryParamValue({
      detail: `Tried to sort on illegal field name ${fieldName}.`
    });
  }

  return {
    field: fieldName,
    direction: sortField.startsWith("-") ? "DESC" : "ASC"
  };
}
