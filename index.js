module.exports = {
  adapters: {
    Mongoose: require('./build/src/adapters/Mongoose/MongooseAdapter')
  },
  types: {
    Collection: require('./build/src/types/Collection'),
    Document: require('./build/src/types/Document'),
    Error: require('./build/src/types/APIError'),
    Resource: require('./build/src/types/Resource')
  },
  controllers: {
    Front: require('./build/src/controllers/Front'),
    API: require('./build/src/controllers/API'),
    Documentation: require('./build/src/controllers/Documentation')
  },
  ResourceTypeRegistry: require('./build/src/ResourceTypeRegistry')
};
