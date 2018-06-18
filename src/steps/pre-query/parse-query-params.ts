import R = require("ramda");
import {
  parseFilter as underlyingFilterParser,
  parseSort as underlyingSortParser
} from '@json-api/querystring';
import * as Errors from '../../util/errors';
import { isValidMemberName } from "../../util/json-api";
import {
  Sort,
  Identifier as IdentifierType,
  ParserOperatorsConfig,
  FieldExpression as FieldExprType
} from "../../types/index";

// Helpers for working with filter/sort param parse results.
export const isFieldExpression =
  (it: any): it is FieldExprType => it && it.type === "FieldExpression";

export const isId =
  (it: any): it is IdentifierType => it && it.type === "Identifier";

export const FieldExpression = <T extends string>(operator: T, args: any[]) =>
  ({ type: <"FieldExpression">"FieldExpression", operator, args });

export const Identifier = (value: string) =>
  ({ type: <"Identifier">"Identifier", value });

// the shape of values in req.queryParams, pre + post parsing.
export type StringListParam = string[];
export type ScopedParam = { [scopeName: string]: any };
export type ScopedStringListParam = { [scopeName: string]: string[] };

export type RawParams = {
  [paramName: string]: any;
};

export type ParsedStandardQueryParams = {
  include?: StringListParam;
  page?: ScopedParam;
  fields?: ScopedStringListParam;
  [paramName: string]: any;
};

export default function(params: RawParams): ParsedStandardQueryParams {
  const paramsToParserFns = {
    include: R.partial(parseCommaSeparatedParamString, ["include"]),
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

export function parseSort(
  rawSortString: string,
  sortOperators: ParserOperatorsConfig
): Sort[] {
  return underlyingSortParser(sortOperators, rawSortString);
}

export function parseFilter(
  rawFilterString: string,
  filterOperators: ParserOperatorsConfig
): FieldExprType[] {
  // Our default parser falls back to eq operator
  // for two item field expressions, so it must be supported
  // (but only if we have a filter query string).
  if(!filterOperators.eq) {
    throw new Error("Must support eq operator on filters");
  }

  return underlyingFilterParser(filterOperators, rawFilterString);
}
