import { Predicate, FieldConstraint } from "../../types/index";
export default function parse(validUnaryOperators: string[], validBinaryOperators: string[], filterList: string): (Predicate | FieldConstraint)[];
