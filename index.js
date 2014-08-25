module.exports = {
  adapters: {
    Mongoose: require('./build/lib/adapters/MongooseAdapter')
  },
  types: {
    Collection: require('./build/lib/types/Collection'),
    Document: require('./build/lib/types/Document'),
    ErrorResource: require('./build/lib/types/ErrorResource'),
    Resource: require('./build/lib/types/Resource')
  },
  controllers: {
    Base: require('./build/lib/controllers/Base'),
    Documentation: require('./build/lib/controllers/Documentation')
  },
  ResourceTypeRegistry: require('./build/lib/ResourceTypeRegistry')
};