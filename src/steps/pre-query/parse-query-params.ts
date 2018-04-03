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
    include: R.partial(parseCommaSeparatedParamString, ["include"]),
    sort: R.pipe(
      R.partial(parseCommaSeparatedParamString, ["sort"]),
      R.map(parseSortField)
    ),
    page: R.pipe(
      R.partial(parseScopedParam, ["page"]),
      R.mapObjIndexed((it: string, scopeName: string) => {
        const asNumber = parseInt(String(it), 10);
        if(String(asNumber) !== String(it)) {
          throw Errors.invalidQueryParamValue({
            detail: "Expected a numeric integer value",
            source: { parameter: `page[${scopeName}]` }
          });
        }

        return asNumber;
      })
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
    throw Errors.invalidQueryParamValue({
      source: { parameter: "fields" }
    });

  return R.mapObjIndexed(
    R.pipe(
      ((v: string, k: string) => parseCommaSeparatedParamString(`fields[${k}]`, v)),
      <(it: string[]) => string[]>R.filter(isValidFieldName)
    ),
    fieldsParam
  );
}

function parseScopedParam(paramName: string, scopedParam: ScopedParam) {
  if(!isScopedParam(scopedParam))
    throw Errors.invalidQueryParamValue({
      source: { parameter: paramName }
    });

  return scopedParam;
}

function parseCommaSeparatedParamString(paramName: string, encodedString: string) {
  if(typeof encodedString !== 'string')
    throw Errors.invalidQueryParamValue({
      detail: "Expected a comma-separated list of strings.",
      source: { parameter: paramName }
    });

  return encodedString.split(",").map(decodeURIComponent);
}

function parseSortField(sortField: string): Sort {
  const fieldName = stripLeadingBMPChar("-")(sortField);

  if(!isValidMemberName(fieldName)) {
    throw Errors.invalidQueryParamValue({
      detail: `Tried to sort on illegal field name ${fieldName}.`,
      source: { parameter: "sort" }
    });
  }

  return {
    field: fieldName,
    direction: sortField.startsWith("-") ? "DESC" : "ASC"
  };
}
