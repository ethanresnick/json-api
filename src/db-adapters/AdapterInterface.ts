import { SupportedOperators } from "../types";
import Data from '../types/Generic/Data';
import { ResourceWithTypePath, ResourceWithId } from '../types/Resource';
import Relationship from '../types/Relationship';
import CreateQuery from "../types/Query/CreateQuery";
import FindQuery from "../types/Query/FindQuery";
import DeleteQuery from "../types/Query/DeleteQuery";
import UpdateQuery from "../types/Query/UpdateQuery";
import AddToRelationshipQuery from "../types/Query/AddToRelationshipQuery";
import RemoveFromRelationshipQuery from "../types/Query/RemoveFromRelationshipQuery";

export type ReturnedResource = ResourceWithTypePath & ResourceWithId;

export type RelationshipUpdateReturning =
  { before?: Relationship, after?: Relationship };

export type FindReturning = {
  primary: Data<ReturnedResource>,
  // Below, using a required property with `| undefined` plays better with
  // destructuring in TS than an optional property without undefined.
  included: ReturnedResource[] | undefined,
  collectionSize: number | undefined
};

export type CreationReturning =
  { created: Data<ReturnedResource> };

export type UpdateReturning =
  { updated: Data<ReturnedResource> };

export type DeletionReturning =
  { deleted?: Data<ReturnedResource> };

export type QueryReturning =
  FindReturning | CreationReturning | UpdateReturning | DeletionReturning | RelationshipUpdateReturning;

export type TypeInfo = { typePath: string[]; extra?: any };
export type TypeIdMapOf<T> = {
  [type: string]: { [id: string]: T | undefined } | undefined;
};

export interface AdapterInstance<T extends new (...args: any[]) => any> {
  constructor: T;
  find(query: FindQuery): Promise<FindReturning>;
  create(query: CreateQuery): Promise<CreationReturning>;
  update(update: UpdateQuery): Promise<UpdateReturning>;
  delete(query: DeleteQuery): Promise<DeletionReturning>;
  addToRelationship(query: AddToRelationshipQuery): Promise<RelationshipUpdateReturning>;
  removeFromRelationship(query: RemoveFromRelationshipQuery): Promise<RelationshipUpdateReturning>;
  getModel(typeName: string): any;
  getRelationshipNames(typeName: string): string[];
  getTypePaths(items: {type: string, id: string}[]): Promise<TypeIdMapOf<TypeInfo>>
}

export interface AdapterClass {
  new (...args: any[]): AdapterInstance<{ new (...args: any[]): any }>;
  getStandardizedSchema(model: any, pluralizer: any): any;
  // Must include the "and" and "eq" operators
  supportedOperators: SupportedOperators
}

export interface Adapter<T extends AdapterClass> extends AdapterInstance<T> {

}
