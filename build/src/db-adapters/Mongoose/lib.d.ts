import Resource from "../../types/Resource";
import { FieldConstraint, Predicate } from "../../types/index";
export declare function errorHandler(err: any): never;
export declare function getReferencePaths(model: any): string[];
export declare function isReferencePath(schemaType: any): boolean;
export declare function getReferencedModelName(model: any, path: any): any;
export declare function toMongoCriteria(constraintOrPredicate: FieldConstraint | Predicate): any;
export declare function resourceToDocObject(resource: Resource): object;
