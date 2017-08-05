/**
 * Peer dependencies may or may not be installed (npm@3 doesn't install them
 * automatically, and users may not need every peer dependency if they bring
 * their own adapters/strategies). So the code below only loads code that needs
 * each peer dependency when necessary, by deferring the requires behind a getter.
 */
export= {
  dbAdapters: {
    get Mongoose() {
      return require('./db-adapters/Mongoose/MongooseAdapter').default
    }
  },
  httpStrategies: {
    get Express() {
      return require('./http-strategies/Express').default
    },
    get Koa() {
      return require('./http-strategies/Koa').default
    }
  },
  types: {
    Collection: require('./types/Collection').default,
    Document: require('./types/Document').default,
    Error: require('./types/APIError').default,
    Resource: require('./types/Resource').default,
    Relationship: require('./types/Relationship').default,
    Linkage: require('./types/Linkage'),
    Documentation: {
      Field: require('./types/Documentation/Field').default,
      FieldType: require('./types/Documentation/FieldType').default
    }
  },
  controllers: {
    API: require('./controllers/API').default,
    Documentation: require('./controllers/Documentation').default
  },
  ResourceTypeRegistry: require('./ResourceTypeRegistry').default
};
