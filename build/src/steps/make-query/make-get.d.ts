import { Request, makeDoc } from "../../types";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import FindQuery from "../../types/Query/FindQuery";
export default function (request: Request, registry: ResourceTypeRegistry, makeDoc: makeDoc): FindQuery;
