import { FinalizedRequest, makeDocument } from "../../types";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import DeleteQuery from "../../types/Query/DeleteQuery";
import RemoveFromRelationshipQuery from "../../types/Query/RemoveFromRelationshipQuery";
export default function (request: FinalizedRequest, registry: ResourceTypeRegistry, makeDoc: makeDocument): DeleteQuery | RemoveFromRelationshipQuery;
