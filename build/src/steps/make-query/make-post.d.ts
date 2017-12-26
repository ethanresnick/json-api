import CreateQuery from "../../types/Query/CreateQuery";
import AddToRelationshipQuery from '../../types/Query/AddToRelationshipQuery';
import { Request } from "../../types";
import ResourceTypeRegistry from "../../ResourceTypeRegistry";
export default function (request: Request, registry: ResourceTypeRegistry, makeDoc: any): CreateQuery | AddToRelationshipQuery;
