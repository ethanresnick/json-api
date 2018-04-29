import R = require("ramda");
import {
  parseFilter as underlyingFilterParser,
  parseSort as underlyingSortParser
} from '@json-api/query-parser';
import * as Errors from '../../util/errors';
import { isValidMemberName } from "../../util/json-api";
import {
  Sort,
  Identifier as IdentifierType,
  FinalizedSupportedOperators,
  FieldExpression as FieldExprType
} from "../../types/index";

// Helpers for working with filter param parse results.
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
  sortOperators: FinalizedSupportedOperators
): Sort[] {
  return underlyingSortParser(sortOperators, rawSortString);
}

export function parseFilter(
  rawFilterString: string,
  filterOperators: FinalizedSupportedOperators
) {
  // Our default parser falls back to eq operator
  // for two item field expressions, so it must be supported
  // (but only if we have a filter query string).
  if(!filterOperators.eq) {
    throw new Error("Must support eq operator on filters");
  }

  return underlyingFilterParser(filterOperators, rawFilterString)
}

/**
 * A default function called to finalize the arguments of a given
 * field expression. This function enforces a number of invariants to simplify
 * the process of writing a correct adapter, but adapters that want looser
 * constraints on operator values can replace it with their own function.
 * In particular it: 1) requires that `and` and `or` operators take a non-empty
 * list of field expressions as their arguments; and 2) requires that binary
 * operators have an identifier as their first argument and a plain value (i.e.,
 * one with no identifiers) as their second.
 */
export function finalizeFilterFieldExprArgs(
  conf: FinalizedSupportedOperators,
  operator: string,
  args: any[]
) {
  if(operator === 'and' || operator === 'or') {
    if(args.length === 0) {
      throw new Error(`The "${operator}" operator requires at least one argument.`);
    }

    if(!args.every(isFieldExpression)) {
      throw new Error(
        `The "${operator}" operator expects its arguments to be field expressions.`
      );
    }
  }

  // For binary operators, there must be an identifier
  // as the first argument (to reference a field).
  // Note: this function gets run only on known operators (it's part of their
  // config, as `finalizeArgs`), so we can have the non-null assertion below.
  // tslint:disable-next-line no-non-null-assertion
  else if(conf[operator]!.isBinary) {
    if(!isId(args[0])) {
      throw new SyntaxError(
        `"${operator}" operator expects field reference as first argument.`
      );
    }

    try {
      assertNoIdentifiers(args[1]);
    } catch (e) {
      throw new SyntaxError(
        `Identifier not allowed in second argument to "${operator}" operator.`
      );
    }
  }

  return args;
}

function assertNoIdentifiers(it: any) {
  if(Array.isArray(it)) {
    it.forEach(assertNoIdentifiers);
  }

  if(isId(it)) {
    throw new Error("Identifier not allowed in this context.");
  }
}
