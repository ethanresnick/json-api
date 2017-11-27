import { Predicate, FieldConstraint } from "../../types/index";
import { Maybe } from "../../util/type-handling";

/**
 * Find the (urlencoded) value for the filter query parameter.
 *
 * Note: we need to do this from the raw query string, not qs's parse result,
 * because qs prematurely decodes the entire parameter's value, whereas the
 * encoded vs unencoded bits are significant to us.
 *
 * Note 2: we take the last occurrence of a param called filter and
 * find the value there, rather than trying to concat them all into an
 * array, which our format doesn't support.
 *
 * @param {string} queryString [description]
 */
export function getFilterList(queryString?: string) {
  return Maybe(queryString).map(it =>
    it.split('&').reduce((acc, paramString) => {
      const [rawKey, rawValue] = splitSingleQueryParamString(paramString);
      return rawKey === 'filter' ? rawValue : acc;
    }, undefined)
  );
}

function splitSingleQueryParamString(paramString: string) {
  const bracketEqualsPos = paramString.indexOf(']=');
  const delimiterPos = bracketEqualsPos === -1
    ? paramString.indexOf('=')
    : bracketEqualsPos + 1;

  // returning [undecoded key, undecoded value]
  return (delimiterPos === -1)
    ? [paramString, '']
    : [paramString.slice(0, delimiterPos), paramString.slice(delimiterPos + 1)];
}

export default function parse(
  validUnaryOperators: string[],
  validBinaryOperators: string[],
  filterList: string
): (Predicate|FieldConstraint)[] {
  const exprs: any[] = [];
  let currExpr = { rest: tokenize(filterList), expr: undefined };

  while(currExpr.rest.length) {
    currExpr = parseExpression(currExpr.rest)
    exprs.push(currExpr.expr);
  }

  // Process each filter expression.
  return exprs.map<Predicate|FieldConstraint>(
    processFilterCriteria.bind(null, validUnaryOperators, validBinaryOperators)
  );
}

/**
 * Take a list that's supposed to represent a filtering criteria
 * and validate/process it. This doesn't operate on lists that
 * are *arguments* to filter criteria, like the third item in
 * (zip,in,(90024,90034,90048)).
 */
function processFilterCriteria(
  validUnaryOps: string[] = [],
  validBinaryOps: string[] = [],
  listNode
): Predicate | FieldConstraint {
  const isList = Array.isArray;
  type SymbolNode = { type: "symbol"; value: string };
  const isSymbol = (it): it is SymbolNode => it && it.type === 'symbol';
  const isValidUnaryOperator = (it) => isSymbol(it) && validUnaryOps.includes(it.value);
  const isValidBinaryOperator = (it) => isSymbol(it) && validBinaryOps.includes(it.value);

  const selfBoundForRecursion =
    processFilterCriteria.bind(null, validUnaryOps, validBinaryOps);

  const throwError = (e) => { throw e }

  const invalidOperatorError = (operator) =>
    new Error(operator && operator.value
      ? `${operator.value} is not a valid operator.`
      : `Could not parse operator`)

  const getField = (node: any) => {
    // we expect fields to be representend as symbols
    return isSymbol(node)
      ? node.value
      : throwError(new Error("Could not parse field symbol."));
  }

  const getValue = (node: any) => {
    // Ideally, we'd expect values to be scalars, not symbols, meaning that
    // strings would've been provided in quotation marks to disambiguate
    // numbers and boolean/null literals from strings that happen to have the
    // same characters. However, because browsers automatically encode quotes
    // in the query string (in violation of more recent standards for URLs but
    // conistent with rfc2396, which was the reigning url standard in the 90s;
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=1040285#c13), the only
    // way to make this useful is to allow symbols as values and assume that,
    // if we get a symbol, it's a sting. That means that it's impossible to
    // express the strings "true", "false", "null", "42" etc unless a user
    // submits a request through curl or something similar that isn't subject
    // to the browser escaping issue. That should be ok.
    // Note: our value is urlencoded to prevent any ' and ()
    // characters in the value from being interpreted as delimiters).
    if(isList(node)) {
      return node.map(getValue);
    }

    const rawValue = isSymbol(node) ? node.value : node;
    return typeof rawValue === 'string' ? decodeURIComponent(rawValue) : rawValue;
  }

  // If we don't have a list...
  if(!isList(listNode)) {
    throw new Error("Filter criteria must be a list.");
  }

  // Three tuples represent (field,eq,value), unless the field name
  // is a valid unary operator (expected to just be and or or for now)
  // and value is a list. If we are in the and/or case, we need to process
  // the value list as a list of filterCriteria (hence the recursion).
  switch(listNode.length) {
    case 2:
      return isValidUnaryOperator(listNode[0]) && isList(listNode[1])
        ? {
            field: undefined,
            operator: listNode[0].value,
            value: listNode[1].map(selfBoundForRecursion)
          }
        : {
            field: getField(listNode[0]),
            operator: "eq",
            value: getValue(listNode[1])
          };

    case 3:
      return {
        field: getField(listNode[0]),
        operator: isValidBinaryOperator(listNode[1])
          ? listNode[1].value
          : throwError(invalidOperatorError(listNode[1])),
        value: getValue(listNode[2])
      };

    default:
      throw new SyntaxError("Filter criteria lists must be two or three items long.");
  }
}

/**
 * Parses a single (possibly compound) expression.
 * Returns both the parsed expression and any tokens
 * remaining after that expression.
 */
function parseExpression(tokens) {
  // copy array so we're not mutating original
  let remainingTokens = tokens.slice(0);

  if(remainingTokens.length === 0)
    throw new SyntaxError("Unexpected end of input");

  // Our (sub) expression is a list
  if(remainingTokens[0] === '(') {
    const closingDelim = ')';
    const listNode: any[] = [];

    // Skip past the opening delimiter.
    remainingTokens.shift();

    while(remainingTokens[0] !== closingDelim) {
      let entry = parseExpression(remainingTokens);

      listNode.push(entry.expr);
      remainingTokens = entry.rest;
    }

    return {
      expr: listNode,

      // Skip past the closing delimiter.
      rest: remainingTokens.slice(1)
    };
  }

  // Our (sub) expression is an atom.
  else {
    return {expr: atomFromToken(tokens[0]), rest: remainingTokens.slice(1)};
  }
}

/**
 * Responsible for parsing pieces that don't have any other
 * pieces nested inside them, i.e. primitives.
 */
function atomFromToken(token) {
  let match;

  // tokens starting and ending with quotes are strings.
  if (token[0] === "'" && token[token.length-1] === "'")
    return token.slice(1, -1);

  // boolean & null literals
  else if (token === "true" || token === "false" || token === "null")
    return token === "null" ? null : (token === "true");

  // the regex below matches floats and integers; assigns to match,
  // which will be falsey if the pattern doesn't match.
  else if (match = /^\d+(\.\d+)?$/.exec(token))
    return Number(match[0]);

  // symbols, like field names and operators
  else if (match = /^[^()',]+$/.exec(token))
    return { type: "symbol", value: token };

  else
    throw new SyntaxError("Not an atom: " + token);
}

/**
 * Returns an array of tokens, not tagged by category.
 * Each token is simply a string.
 *
 * Note that strings are returned with their opening
 * and closing quotes as part of the token, for simpler
 * parsing later.
 */
function tokenize(program) {
  var delimiters = /^[(),]/,
      tokens: string[] = [],
      currToken = "",
      currPos = 0,
      char = program[0],
      lastProgramIndex = program.length - 1;

  const finalizeToken = () => {
    if(currToken.length)
      tokens.push(currToken)

    currToken = "";
  }

  const advance = () => {
    currPos++;
    char = program[currPos];
  }

  while(currPos < program.length) {
    // When we get to the start of a string, immediately build
    // that whole token, which is easy because no normal delimiters
    // trigger new tokens in strings. This saves us from having to
    // store state flags for this outer loop.
    if(char === "'") {
      finalizeToken();

      do {
        // We're on the program's last character and haven't found
        // the ending double quote yet. (Check >= also, in case the
        // escape-handling code skipped over the last character.)
        if(currPos >= lastProgramIndex)
          throw new SyntaxError("Unexpected end of string");

        currToken += char;
        advance();
      }
      while(char !== "'");

      currToken += char; // Capture the ending quote.
      finalizeToken();
    }

    // If we encounter a delimiter outside a string,
    // finalize the prior token and add a token
    // for the delimiter itself, unless the delim is a comma,
    // which just separates tokens and doesn't need a token itself.
    else if(delimiters.test(char)) {
      finalizeToken();

      if(char !== ',')
        tokens.push(char);
    }

    // We have a character that's part of a literal outside a string.
    else {
      currToken += char;
    }

    advance();
  }

  // Above, we're adding the tokens that we build up character
  // by character, like symbol names or int literals, to the token
  // list when we get to the delimiter after the token ends. But,
  // if such a token is the last token in the stream, we need to
  // add it too! This does that.
  finalizeToken();

  return tokens;
}
