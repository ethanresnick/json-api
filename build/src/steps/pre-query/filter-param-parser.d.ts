import { Predicate, FieldConstraint } from "../../types/index";
import { Maybe } from "../../util/type-handling";
export declare function getFilterList(queryString?: string): Maybe<string>;
export default function parse(validUnaryOperators: string[], validBinaryOperators: string[], filterList: string): (Predicate | FieldConstraint)[];
