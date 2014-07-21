module.exports = {
  adapters: {
    Mongoose: require('./build/adapters/MongooseAdapter')
  },
  Collection: require('./build/Collection'),
  Document: require('./build/Document'),
  ErrorResource: require('./build/ErrorResource'),
  Resource: require('./build/Resource'),
  ResourceType: require('./build/ResourceType')
};