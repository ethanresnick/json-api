import UpdateQuery from '../../types/Query/UpdateQuery';
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import { FinalizedRequest, makeDocument } from "../../types";
export default function (request: FinalizedRequest, registry: ResourceTypeRegistry, makeDoc: makeDocument): UpdateQuery;
