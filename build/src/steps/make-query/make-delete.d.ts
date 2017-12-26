import { Request, makeDoc } from "../../types";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
import DeleteQuery from "../../types/Query/DeleteQuery";
import RemoveFromRelationshipQuery from "../../types/Query/RemoveFromRelationshipQuery";
export default function (request: Request, registry: ResourceTypeRegistry, makeDoc: makeDoc): DeleteQuery | RemoveFromRelationshipQuery;
