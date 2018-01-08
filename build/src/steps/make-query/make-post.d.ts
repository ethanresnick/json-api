import CreateQuery from "../../types/Query/CreateQuery";
import AddToRelationshipQuery from '../../types/Query/AddToRelationshipQuery';
import { FinalizedRequest } from "../../types";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
export default function (request: FinalizedRequest, registry: ResourceTypeRegistry, makeDoc: any): CreateQuery | AddToRelationshipQuery;
