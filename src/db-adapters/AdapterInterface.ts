export interface AdapterInstance<T extends new (...args) => any> {
  constructor: T;
  find(type: any, idOrIds: any, fields: any, sorts: any, filters: any, includePaths: any, offset: any, limit: any): any;
  create(parentType: any, resourceOrCollection: any): any;
  update(parentType: any, resourceOrCollection: any): any;
  delete(parentType: any, idOrIds: any): any;
  addToRelationship(type: any, id: any, relationshipPath: any, newLinkage: any): any;
  removeFromRelationship(type: any, id: any, relationshipPath: any, linkageToRemove: any): any;
  getModel(modelName)
  getTypesAllowedInCollection(parentType: any): any;
  getRelationshipNames(type: any): any;

};

export interface AdapterClass {
  new (...args): AdapterInstance<{new (...args): any}>;
  getStandardizedSchema(model: any, pluralizer: any): any;
  getChildTypes(type: string): string[];
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
