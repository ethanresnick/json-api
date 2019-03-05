import R = require("ramda");
import Maybe, { Just, Nothing } from "../types/Generic/Maybe";
export { Just, Nothing };

/**
 * Find the (raw/urlencoded) value of a query parameter from a query string.
 * This is used because the raw parse result from `qs` automatically urldecodes
 * characters prematurely for some of our parsing purposes.
 *
 * Query parameter names are extracted according to application/x-www-form-urlencoded
 * (https://url.spec.whatwg.org/#urlencoded-parsing), while query parameter values are left exactly
 * as they occur in the URL, per JSON:API's allowance:
 * https://jsonapi.org/format/1.1/#appendix-query-details-parsing
 */
export const getQueryParamValue =
  R.curry((paramName: string, queryString: string | undefined) => {
    return Maybe(queryString).map(it =>
      it.split("&").reduce((acc: string | undefined, paramString) => {
        const [parsedKey, rawValue] = parseSingleQueryParamString(paramString);
        return parsedKey === paramName ? rawValue : acc;
      }, undefined)
    );
  });

function parseSingleQueryParamString(paramString: string) {
  const firstEqualPos = paramString.indexOf("=");
  const [parsedKey, rawValue] = firstEqualPos === -1
    ? [decodeURIComponent(paramString.replace("+"," ")), ""]
    : [decodeURIComponent(paramString.slice(0, firstEqualPos).replace("+"," ")),
      paramString.substr(firstEqualPos+1)];
  return [parsedKey, rawValue]
}

