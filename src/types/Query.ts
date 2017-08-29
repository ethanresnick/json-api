// where is always defined, even if it's an empty object.
// todo: normalize where clause to simpify predicates, possibly after every transformation??
// https://github.com/balderdashy/waterline/blob/master/lib/waterline/utils/query/private/normalize-where-clause.js
export type WhereCriteria = {
  where: AndPredicate | OrPredicate;
}

export type AndPredicate = { and: Constraint[]; or: undefined };
export type OrPredicate = { or: Constraint[]; and: undefined };
export type Constraint = AndPredicate | OrPredicate | {
  [fieldName: string]: {
    eq: number | string | boolean
  } | {
    in: string[] | number[]
  } | {
    nin: string[] | number[]
  } | {
    '<': string | number
  } | {
    '<=': string | number
  } | {
    '>': string | number
  } | {
    '>=': string | number
  } | {
    '!=': string | number
  } | {
    like: string | number
  } | {
    contains: string | number
  } | {
    startsWith: string | number
  } | {
    endsWith: string | number
  }
}
