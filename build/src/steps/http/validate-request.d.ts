import { Request } from "../../types";
export declare function checkBodyExistence(request: Request): Promise<void>;
export declare function checkMethod({method}: Request): Promise<void>;
