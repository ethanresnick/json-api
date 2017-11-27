"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const type_handling_1 = require("../../util/type-handling");
function getFilterList(queryString) {
    return type_handling_1.Maybe(queryString).map(it => it.split('&').reduce((acc, paramString) => {
        const [rawKey, rawValue] = splitSingleQueryParamString(paramString);
        return rawKey === 'filter' ? rawValue : acc;
    }, undefined));
}
exports.getFilterList = getFilterList;
function splitSingleQueryParamString(paramString) {
    const bracketEqualsPos = paramString.indexOf(']=');
    const delimiterPos = bracketEqualsPos === -1
        ? paramString.indexOf('=')
        : bracketEqualsPos + 1;
    return (delimiterPos === -1)
        ? [paramString, '']
        : [paramString.slice(0, delimiterPos), paramString.slice(delimiterPos + 1)];
}
function parse(validUnaryOperators, validBinaryOperators, filterList) {
    const exprs = [];
    let currExpr = { rest: tokenize(filterList), expr: undefined };
    while (currExpr.rest.length) {
        currExpr = parseExpression(currExpr.rest);
        exprs.push(currExpr.expr);
    }
    return exprs.map(processFilterCriteria.bind(null, validUnaryOperators, validBinaryOperators));
}
exports.default = parse;
function processFilterCriteria(validUnaryOps = [], validBinaryOps = [], listNode) {
    const isList = Array.isArray;
    const isSymbol = (it) => it && it.type === 'symbol';
    const isValidUnaryOperator = (it) => isSymbol(it) && validUnaryOps.includes(it.value);
    const isValidBinaryOperator = (it) => isSymbol(it) && validBinaryOps.includes(it.value);
    const selfBoundForRecursion = processFilterCriteria.bind(null, validUnaryOps, validBinaryOps);
    const throwError = (e) => { throw e; };
    const invalidOperatorError = (operator) => new Error(operator && operator.value
        ? `${operator.value} is not a valid operator.`
        : `Could not parse operator`);
    const getField = (node) => {
        return isSymbol(node)
            ? node.value
            : throwError(new Error("Could not parse field symbol."));
    };
    const getValue = (node) => {
        if (isList(node)) {
            return node.map(getValue);
        }
        const rawValue = isSymbol(node) ? node.value : node;
        return typeof rawValue === 'string' ? decodeURIComponent(rawValue) : rawValue;
    };
    if (!isList(listNode)) {
        throw new Error("Filter criteria must be a list.");
    }
    switch (listNode.length) {
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
function parseExpression(tokens) {
    let remainingTokens = tokens.slice(0);
    if (remainingTokens.length === 0)
        throw new SyntaxError("Unexpected end of input");
    if (remainingTokens[0] === '(') {
        const closingDelim = ')';
        const listNode = [];
        remainingTokens.shift();
        while (remainingTokens[0] !== closingDelim) {
            let entry = parseExpression(remainingTokens);
            listNode.push(entry.expr);
            remainingTokens = entry.rest;
        }
        return {
            expr: listNode,
            rest: remainingTokens.slice(1)
        };
    }
    else {
        return { expr: atomFromToken(tokens[0]), rest: remainingTokens.slice(1) };
    }
}
function atomFromToken(token) {
    let match;
    if (token[0] === "'" && token[token.length - 1] === "'")
        return token.slice(1, -1);
    else if (token === "true" || token === "false" || token === "null")
        return token === "null" ? null : (token === "true");
    else if (match = /^\d+(\.\d+)?$/.exec(token))
        return Number(match[0]);
    else if (match = /^[^()',]+$/.exec(token))
        return { type: "symbol", value: token };
    else
        throw new SyntaxError("Not an atom: " + token);
}
function tokenize(program) {
    var delimiters = /^[(),]/, tokens = [], currToken = "", currPos = 0, char = program[0], lastProgramIndex = program.length - 1;
    const finalizeToken = () => {
        if (currToken.length)
            tokens.push(currToken);
        currToken = "";
    };
    const advance = () => {
        currPos++;
        char = program[currPos];
    };
    while (currPos < program.length) {
        if (char === "'") {
            finalizeToken();
            do {
                if (currPos >= lastProgramIndex)
                    throw new SyntaxError("Unexpected end of string");
                currToken += char;
                advance();
            } while (char !== "'");
            currToken += char;
            finalizeToken();
        }
        else if (delimiters.test(char)) {
            finalizeToken();
            if (char !== ',')
                tokens.push(char);
        }
        else {
            currToken += char;
        }
        advance();
    }
    finalizeToken();
    return tokens;
}
