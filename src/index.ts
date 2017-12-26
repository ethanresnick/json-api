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
import Document from './types/Document'
import Error from './types/APIError'
import Resource from './types/Resource'
import Relationship from './types/Relationship'
import ResourceSet from './types/ResourceSet'
import Field from './types/Documentation/Field'
import FieldType from './types/Documentation/FieldType'
import API from './controllers/API'
import Documentation from './controllers/Documentation'
import ResourceTypeRegistry from './ResourceTypeRegistry'

export= {
  dbAdapters: {
    get Mongoose() {
      return <typeof MongooseAdapter>require('./db-adapters/Mongoose/MongooseAdapter').default
    }
  },
  httpStrategies: {
    get Express() {
      return <typeof ExpressStrategy>require('./http-strategies/Express').default
    },
    get Koa() {
      return <typeof KoaStrategy>require('./http-strategies/Koa').default
    }
  },
  types: {
    Document,
    Error,
    Resource,
    ResourceSet,
    Relationship,
    Documentation: {
      Field,
      FieldType
    }
  },
  controllers: {
    API,
    Documentation
  },
  ResourceTypeRegistry
};
