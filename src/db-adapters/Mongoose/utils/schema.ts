import { Model, SchemaType } from "mongoose";

export function getReferencePaths(model: Model<any>) {
  const paths: string[] = [];
  model.schema.eachPath((name, type) => {
    if(isReferencePath(type)) paths.push(name);
  });
  return paths;
}

export function isReferencePath(schemaType: SchemaType) {
  const options = ((schemaType as any).caster || schemaType).options;
  return options && options.ref !== undefined;
}

export function isRootModel(model: Model<any>) {
  return !model.baseModelName;
}

export function getReferencedModelName(model: Model<any>, path: string): string | undefined {
  const schemaType = model.schema.path(path);
  const schemaOptions = ((schemaType as any).caster || schemaType).options;
  return schemaOptions && schemaOptions.ref;
}

export function getDiscriminatorKey(model: Model<any>): string | undefined {
  return (model.schema as any).options.discriminatorKey;
}

export function getVersionKey(model: Model<any>): string {
  return (model.schema as any).options.versionKey;
}

/**
 * Returns a list of schema keys that don't correspond to user-defined data
 * fields, like the version key and the discriminator key.
 */
export function getMetaKeys(model: Model<any>) {
  return [getDiscriminatorKey(model), getVersionKey(model)]
    .filter(it => it !== undefined) as string[];
}
