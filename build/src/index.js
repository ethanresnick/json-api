"use strict";
module.exports = {
    dbAdapters: {
        get Mongoose() {
            return require('./db-adapters/Mongoose/MongooseAdapter').default;
        }
    },
    httpStrategies: {
        get Express() {
            return require('./http-strategies/Express').default;
        },
        get Koa() {
            return require('./http-strategies/Koa').default;
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
