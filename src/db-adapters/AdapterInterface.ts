import CreateQuery from "../types/Query/CreateQuery";
import FindQuery from "../types/Query/FindQuery";
import DeleteQuery from "../types/Query/DeleteQuery";
import UpdateQuery from "../types/Query/UpdateQuery";
import AddToRelationshipQuery from "../types/Query/AddToRelationshipQuery";
import RemoveFromRelationshipQuery from "../types/Query/RemoveFromRelationshipQuery";

export type TypeInfo = { typePath: string[]; extra?: any };
export type TypeIdMapOf<T> = {
  [type: string]: { [id: string]: T | undefined } | undefined;
};

export interface AdapterInstance<T extends new (...args: any[]) => any> {
  constructor: T;
  find(query: FindQuery): Promise<any>;
  create(query: CreateQuery): Promise<any>;
  update(update: UpdateQuery): Promise<any>;
  delete(query: DeleteQuery): Promise<any>;
  addToRelationship(query: AddToRelationshipQuery): Promise<any>;
  removeFromRelationship(query: RemoveFromRelationshipQuery): Promise<any>;
  getModel(typeName: string): any;
  getRelationshipNames(typeName: string): string[];
  doQuery(query: any): Promise<any>;
  getTypePaths(items: {type: string, id: string}[]): Promise<TypeIdMapOf<TypeInfo>>
};

export interface AdapterClass {
  new (...args: any[]): AdapterInstance<{ new (...args: any[]): any }>;
  getStandardizedSchema(model: any, pluralizer: any): any;
  unaryFilterOperators: string[]; // must include "and"
  binaryFilterOperators: string[]; // must include "eq"
}

export interface Adapter<T extends AdapterClass> extends AdapterInstance<T> {

}


/*

interface PointJson { x: number; y: number; }
class Point /*static implements JsonSerializableStatic<PointJson, Point> {
    static fromJson(obj: PointJson): Point {
        return new Point(obj.x, obj.y)
    }

    constructor(readonly x: number, readonly y: number) {}

    toJson(): PointJson {
        return { x: this.x, y: this.y };
    }
}
// Hack for 'static implements'
const _: AdapterStatic<PointJson, Point> = Point;
*/
