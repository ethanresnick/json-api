/**
 * Peer dependencies may or may not be installed (npm@3 doesn't install them
 * automatically, and users may not need every peer dependency if they bring
 * their own adapters/strategies). So the code below only loads code that needs
 * each peer dependency when necessary, by deferring the requires behind a getter.
 *
 * The imports for the getter-protected values (i.e., MongooseAdapter, KoaStrategy,
 * etc.) just bring in type information; they're not part of the compiled output.
 */
import MongooseAdapter from "./db-adapters/Mongoose/MongooseAdapter";
import ExpressStrategy from "./http-strategies/Express";
import KoaStrategy from "./http-strategies/Koa";

// These imports are part of the compiled output and aren't lazy loaded.
import Document from "./types/Document";
import Error, { displaySafe as displaySafeError } from "./types/APIError";
import Data from "./types/Generic/Data";
import Resource from "./types/Resource";
import ResourceIdentifier from "./types/ResourceIdentifier";
import ResourceSet from "./types/ResourceSet";
import Relationship from "./types/Relationship";
import { RFC6570String } from './types/UrlTemplate';
import Field from "./types/Documentation/Field";
import FieldType from "./types/Documentation/FieldType";
import API from "./controllers/API";
import Documentation from "./controllers/Documentation";
import ResourceTypeRegistry from "./ResourceTypeRegistry";

import CreateQuery from "./types/Query/CreateQuery";
import FindQuery from "./types/Query/FindQuery";
import UpdateQuery from "./types/Query/UpdateQuery";
import DeleteQuery from "./types/Query/DeleteQuery";
import AddToRelationshipQuery from "./types/Query/AddToRelationshipQuery";
import RemoveFromRelationshipQuery from "./types/Query/RemoveFromRelationshipQuery";

import * as namingHelpers from "./util/naming-conventions";
import * as Errors from "./util/errors";

// Export types for typescript
export { FinalizedRequest as Request, Result, HTTPResponse } from "./types";
export {
  Document, Error, Resource, ResourceIdentifier, ResourceSet, Relationship,
  API as APIController, Documentation as DocumentationController,
  CreateQuery, FindQuery, UpdateQuery, DeleteQuery, AddToRelationshipQuery, RemoveFromRelationshipQuery,
  Field, FieldType, ResourceTypeRegistry, displaySafeError, RFC6570String, Data, Errors
};

export const dbAdapters = {
  get Mongoose() {
    return <typeof MongooseAdapter>require("./db-adapters/Mongoose/MongooseAdapter").default;
  }
};

export const httpStrategies = {
  get Express() {
    return <typeof ExpressStrategy>require("./http-strategies/Express").default;
  },
  get Koa() {
    return <typeof KoaStrategy>require("./http-strategies/Koa").default;
  }
};

export const helpers = { ...namingHelpers };

export const types = {
  Document,
  Error,
  Resource,
  ResourceIdentifier,
  ResourceSet,
  Relationship,
  Documentation: {
    Field,
    FieldType
  },
  Query: {
    Find: FindQuery,
    Create: CreateQuery,
    Update: UpdateQuery,
    Delete: DeleteQuery,
    AddToRelationship: AddToRelationshipQuery,
    RemoveFromRelationship: RemoveFromRelationshipQuery
  }
};

export const controllers = {
  API,
  Documentation
};

const defaultExp = {
  types,
  controllers,
  httpStrategies,
  dbAdapters,
  helpers,
  displaySafeError,
  RFC6570String,
  Errors,
  ResourceTypeRegistry
};

export default defaultExp;
