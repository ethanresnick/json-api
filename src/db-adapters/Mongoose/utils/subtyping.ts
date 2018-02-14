import { Model } from "mongoose";
import { isRootModel } from "./schema";
import { StrictDictMap } from '../../../types';

export function getTypePath(
  model: Model<any>,
  modelNamesToTypeNames: StrictDictMap<string>
) {
  const modelNames = isRootModel(model)
    ? [model.modelName]
    : [model.modelName, model.baseModelName as string];

  return modelNames.map(it => modelNamesToTypeNames[it]) as string[];
}
