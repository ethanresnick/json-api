import Resource from "../../types/Resource";
import Linkage from "../../types/Linkage";
import Collection from "../../types/Collection";
export default function (data: any, parseAsLinkage?: boolean): Promise<Linkage | Resource | Collection>;
