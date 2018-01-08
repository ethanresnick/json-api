import { Predicate, FieldConstraint } from "../../types/index";
import { Just, Nothing } from "../../types/Generic/Maybe";
export { Just, Nothing };
export declare function getFilterList(queryString?: string): Just<string> | Nothing<string>;
export default function parse(validUnaryOperators: string[], validBinaryOperators: string[], filterList: string): (Predicate | FieldConstraint)[];
