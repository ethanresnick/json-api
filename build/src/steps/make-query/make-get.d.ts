import { FinalizedRequest, makeDocument } from "../../types";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import FindQuery from "../../types/Query/FindQuery";
export default function (request: FinalizedRequest, registry: ResourceTypeRegistry, makeDoc: makeDocument): FindQuery;
