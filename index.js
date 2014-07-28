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
  BaseController: require('./build/lib/BaseController')
};