import { ValidatedRequest, Query } from "../../types";
export default function (request: ValidatedRequest): Promise<Query>;
export declare const assertBodyAbsent: (request: ValidatedRequest) => void;
export declare const assertBodyPresent: (request: ValidatedRequest) => void;
