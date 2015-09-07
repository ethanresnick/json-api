var mongooseAdapter = null;

try {
    var mongoose = require.resolve('mongoose');

    mongooseAdapter = require('./build/src/db-adapters/Mongoose/MongooseAdapter');
} catch (e) {
    mongooseAdapter = function() {
        throw new Error("Cannot use dbAdapters.Mongoose because 'mongoose' module is missing.")
    };
}

module.exports = {
  dbAdapters: {
    Mongoose: mongooseAdapter
  },
  httpStrategies: {
    Express: require('./build/src/http-strategies/Express'),
  },
  types: {
    Collection: require('./build/src/types/Collection'),
    Document: require('./build/src/types/Document'),
    Error: require('./build/src/types/APIError'),
    Resource: require('./build/src/types/Resource')
  },
  controllers: {
    API: require('./build/src/controllers/API'),
    Documentation: require('./build/src/controllers/Documentation')
  },
  ResourceTypeRegistry: require('./build/src/ResourceTypeRegistry')
};
