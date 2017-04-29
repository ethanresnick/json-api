/**
 * Peer dependencies may or may not be installed (npm@3 doesn't install them
 * automatically, and users may not need every peer dependency if they bring
 * their own adapters/strategies). So the code below only tries to require them
 * when they're asked for, as doing otherwise can cause errors.
 */
module.exports = {
  dbAdapters: {
    get Mongoose() {
      return require('./build/src/db-adapters/Mongoose/MongooseAdapter')
    }
  },
  httpStrategies: {
    get Express() {
      return require('./build/src/http-strategies/Express')
    },
    get Koa() {
      return require('./build/src/http-strategies/Koa')
    }
  },
  types: {
    Collection: require('./build/src/types/Collection'),
    Document: require('./build/src/types/Document'),
    Error: require('./build/src/types/APIError'),
    Resource: require('./build/src/types/Resource'),
    Relationship: require('./build/src/types/Relationship'),
    Linkage: require('./build/src/types/Linkage'),
    Documentation: {
      Field: require('./build/src/types/Documentation/Field'),
      FieldType: require('./build/src/types/Documentation/FieldType')
    },
    RelationshipObject: require('./build/src/types/RelationshipObject')
  },
  controllers: {
    API: require('./build/src/controllers/API'),
    Documentation: require('./build/src/controllers/Documentation')
  },
  ResourceTypeRegistry: require('./build/src/ResourceTypeRegistry')
};
