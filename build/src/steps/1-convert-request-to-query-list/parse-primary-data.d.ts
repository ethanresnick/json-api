import { ValidatedRequest } from "../../types";
import Resource from "../../types/Resource";
import Linkage from "../../types/Linkage";
import Collection from "../../types/Collection";
export default function parsePrimaryData(data: ValidatedRequest["body"]["data"], parseAsLinkage: boolean): Promise<Linkage | Resource | Collection>;
