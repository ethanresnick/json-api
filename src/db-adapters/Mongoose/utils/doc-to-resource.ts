import { Model, Document } from "mongoose";
import Data from "../../../types/Generic/Data";
import Resource, { ResourceWithTypePath } from "../../../types/Resource";
import ResourceIdentifier from "../../../types/ResourceIdentifier";
import Relationship from "../../../types/Relationship";
import { deleteNested } from "../../../util/misc";
import { StrictDictMap } from "../../../types";
import { getTypePath } from "./subtyping";
import {
  getReferencePaths,
  getReferencedModelName,
  getDiscriminatorKey
} from "./schema";

/**
 * This function takes a Mongoose document and returns a Resource instance for it.
 *
 * @param {object} models A dictionary of all the mongoose models by name.
 *   Needed to look up the models of the ids that relationship fields hold.
 *
 * @param {object} modelNamesToTypeNames A dictionary of model names to their
 *   json-api type values. Used to set the appropriate type on the Resource,
 *   the ResourceIdentifiers in its Relationships and the Resource.typePath.
 *
 * @param {mongoose.Document} doc The document to convert into a resource.
 * @param {object} fields
 *
 * TODO UPDATE FIELDS ARG FORMAT NOW THAT THERE'S ONLY ONE POSSIBLE TYPE.
 * DOCUMENT.
 */
export default function docToResource(
  models: { [modelName: string]: Model<any> },
  modelNamesToTypeNames: StrictDictMap<string>,
  doc: Document,
  fields?: object
) {
  const model = doc.constructor as Model<any>;
  const discriminatorKey = getDiscriminatorKey(model);
  const baseModelName = model.baseModelName || model.modelName;
  const baseType = modelNamesToTypeNames[baseModelName];

  if(!baseType) {
    throw new Error("Unrecognized model.");
  }

  const refPaths = getReferencePaths(model);

  // Get and clean up attributes
  // Note: we can't use the depopulate attribute because it doesn't just
  // depopulate fields _inside_ the passed in doc, but can actually turn the
  // doc itself into a string if the doc was originally gotten by population.
  // That's stupid, and it breaks our include handling.
  let attrs = doc.toJSON({ virtuals: true, getters: true, versionKey: false });
  delete attrs.id; // from the id virtual.
  delete attrs._id;

  if(discriminatorKey) {
    // tslint:disable-next-line no-dynamic-delete
    delete attrs[discriminatorKey];
  }

  // Delete attributes that aren't in the included fields.
  // TODO: Some virtuals could be expensive to compute, so, if field
  // restrictions are in use, we shouldn't set {virtuals: true} above and,
  // instead, we should read only the virtuals that are needed (by searching
  // the schema to identify the virtual paths and then checking those against
  // fields) and add them to newAttrs.
  if(fields && fields[baseType]) {
    const newAttrs = {};
    fields[baseType].forEach((field) => {
      if(attrs[field]) {
        newAttrs[field] = attrs[field];
      }
    });
    attrs = newAttrs;
  }

  // Build relationships
  const relationships = {};
  const getProp = (obj, part) => obj[part];

  refPaths.forEach((path) => {
    // skip if applicable
    if(fields && fields[baseType] && !fields[baseType].includes(path)) {
      return;
    }

    // get value at the path w/ the reference, in both the json'd + full docs.
    const pathParts = path.split(".");
    const jsonValAtPath = pathParts.reduce(getProp, attrs);
    const referencedModelName = getReferencedModelName(model, path);

    if(!referencedModelName || !models[referencedModelName]) {
      throw new Error("Invalid referenced model name. Check for typos in schema.");
    }

    const referencedModelBaseName =
      models[referencedModelName].baseModelName || referencedModelName;
    const referencedType = modelNamesToTypeNames[referencedModelBaseName] as string;

    // delete the attribute, since we're moving it to relationships
    deleteNested(path, attrs);

    // Now, since the value wasn't excluded, we need to build its
    // Relationship. Note: the value could be null or undefined (if it's an
    // empty to-one relationship; `null` if it was set to that explicitly and
    // undefined if it's never been set) or an empty array (an empty to-many
    // relationship; these should never be undefined, as mongoose will default
    // to an array). Moreover, because of population, when there is content,
    // it can be a document or array of documents, in addition to a single id
    // or array of ids. So, we leverage Data.fromJSON to handle these cases,
    // just converting undefined to null first, since that's what JSON:API
    // uses to represent the missing, singular case.
    const normalizedValAtPath =
      typeof jsonValAtPath === "undefined" ? null : jsonValAtPath;

    const linkage = Data.fromJSON(normalizedValAtPath).map((docOrId) => {
      // Below, if docOrId has an _id prop, we're dealing with a mongoose doc
      // from population, so we extract the id; otherwise we already have an
      // id. Regardless, we stringify the result because, even though we did
      // toJSON, the id may be an ObjectId (lame).
      return new ResourceIdentifier(
        referencedType,
        String(docOrId._id ? docOrId._id : docOrId)
      );
    });

    // go back from an array if neccessary and save.
    relationships[path] = Relationship.of({
      data: linkage,
      owner: { type: baseType, id: doc.id, path }
    });
  });

  // finally, create the resource.
  const res = new Resource(baseType, doc.id, attrs, relationships);
  res.typePath = getTypePath(model, modelNamesToTypeNames);
  return res as ResourceWithTypePath;
}
