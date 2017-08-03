import { Request, ValidatedRequest } from "../../types/index";
export default function (extraRequestValidators?: never[]): (request: Request) => Promise<ValidatedRequest>;
