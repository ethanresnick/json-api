import R = require("ramda");
import { isValidMemberName } from "../../util/json-api"
import { stripLeadingBMPChar } from "../../util/misc"
import { Request, Sort } from '../../types/index';
import APIError from "../../types/APIError";

// the shape of values in req.queryParams, pre + post parsing.
export type stringListParam = string[];
export type scopedParam = { [scopeName: string]: any };
export type scopedStringListParam = { [scopeName: string]: string[] };

export type ParsedQueryParams = {
  include?: stringListParam;
  sort?: Sort[];
  page?: scopedParam;
  filter?: scopedParam;
  fields?: scopedStringListParam;
}

export default async function(request: Request): Promise<ParsedQueryParams> {
  const paramsToParserFns = {
    include: parseCommaSeparatedParamString, 
    sort: R.pipe(parseCommaSeparatedParamString, R.map(parseSortParam)),
    page: parseScopedParam,
    filter: parseScopedParam,
    fields: parseFieldsParam
  };

  return R.mapObjIndexed((v: any, paramName: string) => {
    return (!R.has(paramName, paramsToParserFns))
      ? v
      : paramsToParserFns[paramName](v)
  }, request.uri.queryParams);
}

const isScopedParam = R.is(Object);
const isField = (it) => !["id", "type"].includes(it);

const parseScopedParam = (scopedParam: scopedParam) => {
  if(!isScopedParam(scopedParam))
    throw new APIError(400, undefined, "Invalid parameter value.");

  return scopedParam;
}

const parseCommaSeparatedParamString = (encodedString: string) => {
  if(typeof encodedString !== 'string')
    throw new Error("Expected string value parameter");

  return encodedString.split(',').map(decodeURIComponent)
}

const parseFieldsParam = (fieldsParam: scopedParam) => {
  if(!isScopedParam(fieldsParam))
    throw new APIError(400, undefined, "Invalid parameter value.");
  
  return R.map<scopedParam, scopedStringListParam>(
    R.pipe(parseCommaSeparatedParamString, R.filter(isField)),
    fieldsParam
  );
}

const parseSortParam = (sortField: string): Sort => {
  const fieldName = stripLeadingBMPChar('-')(sortField);

  if(!isValidMemberName(fieldName)) {
    throw new APIError(400, undefined, `Tried to sort on illegal field name ${fieldName}.`);
  }

  return {
    [fieldName]: sortField.startsWith('-') ? 'DESC' : 'ASC'
  };
};