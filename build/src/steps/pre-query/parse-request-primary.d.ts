import Resource from "../../types/Resource";
import ResourceIdentifier from "../../types/ResourceIdentifier";
import Data from '../../types/Data';
export default function (jsonData: any, parseAsLinkage?: boolean): Promise<Data<ResourceIdentifier> | Data<Resource>>;
