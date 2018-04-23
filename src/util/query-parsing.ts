import R = require("ramda");
import Maybe, { Just, Nothing } from "../types/Generic/Maybe";
export { Just, Nothing };

/**
 * Find the (raw/urlencoded) value of a query parameter from a query string.
 * This is used because the raw parse result from `qs` automatically urldecodes
 * characters prematurely for some of our parsing purposes.
 */
export const getQueryParamValue =
  R.curry((paramName: string, queryString: string | undefined) => {
    return Maybe(queryString).map(it =>
      it.split("&").reduce((acc: string | undefined, paramString) => {
        const [rawKey, rawValue] = splitSingleQueryParamString(paramString);
        return rawKey === paramName ? rawValue : acc;
      }, undefined)
    );
  });

function splitSingleQueryParamString(paramString: string) {
  const bracketEqualsPos = paramString.indexOf("]=");
  const delimiterPos =
    bracketEqualsPos === -1 ? paramString.indexOf("=") : bracketEqualsPos + 1;

  // returning [undecoded key, undecoded value]
  return delimiterPos === -1
    ? [paramString, ""]
    : [paramString.slice(0, delimiterPos), paramString.slice(delimiterPos + 1)];
}
