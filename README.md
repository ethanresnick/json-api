json-api
========

This library creates a [JSON API](http://jsonapi.org/)-compliant REST API from your [Express](http://expressjs.com/) app. And it generates API documentation automatically. Currently, it works with [Mongoose](http://mongoosejs.com/) models, but it can be extended to support other databases.

# Installation
```$ npm install json-api```

# Example API
```javascript
  var app = require('express')()
    , API = require('json-api');
  
  var models = {
    "Person": require('./models/person'),
    "Place": require('./models/place')
  };
 
  var registry = new API.ResourceTypeRegistry();
  var controller = new API.controllers.Base(Registry);
  var adapter = new API.adapters.Mongoose(models);
  
  registry.type("people", {
    adapter: adapter,
    urlTemplates: {
      "people": "/people/{people.id}",
      "people.favoritePlace": "/places/{people.favoritePlace}"
    }
  });
  
  registry.type("places", {
    adapter: adapter,
    urlTemplates: {"places": "/places/{places.id}"}
  });
  
  app.get("/:type(people,places)", controller.GET);
  app.get("/:type(people,places)/:id", controller.GET);
  app.post("/:type(people,places)", controller.POST);
  app.put("/:type(people,places)/:id", controller.PUT);
  app.delete("/:type(people,places)/:id", controller.DELETE);
  
  app.listen(3000);
  ```

# Core Concepts
## Resource Type Descriptions
The JSON-API spec is built around the idea of typed resource collections. For example, you can have a `"people"` collection and a `"companies"` collection. (By convention, type names are plural and lowercase.)

To use this library, describe how resources of each type should be handled, and then register that description with a central `ResourceTypeRegistry`; those are the `registry.type()` calls in the example above. A resource type description is simply an object with the following properties:

- `urlTemplates`: an object containing the url templates for all properties on resources of this type that link to other resources. The keys (paths) and values (templates) on this object take the same format as those used in [the JSON-API spec](http://jsonapi.org/format/#document-structure-url-templates).
- `adapter`: the [adapter](#adapters) used to find and update these resources. By specifying this for each resource type, different resource types can live in different kinds of databases.
- `afterQuery` (optional): a function called on each resource after it's found by the adapter but before it's sent to the client. This lets you do things like hide fields that some users aren't authorized to see.
- `beforeSave` (optional): a function called on each resource provided by the client (i.e. in a `POST` or `PUT` request) before it's sent to the adapter for saving. You can transform the data here to make it valid.
- `labelToIdOrIds` (optional): If defined, this function will be called to transform the `id` request parameter into a database id or array of ids. This allows you to create resources (in the REST sense of the term) that map to different database items over time. For example, you could have a `/events/upcoming` resource or a `/users/me` resource; this function would be responsible for converting the "upcoming" and "me" labels to the proper database id(s). The function can return a Promise if needed.

## Routing, Authentication & Controllers
This library gives you a base API controller (shown in the example) and a `Documentation` controller, but it doesn't prescribe how requests get to these controllers. This allows you to use any url scheme, routing layer, or authentication system you already have in place. You just need to make sure `req.params.type` reflects the requested resource type, and `req.params.id` reflects the requested id (or comma-separated list of ids), if present. In the example above, routing is handled with Express's built-in `app[VERB]` methods. If you're looking for something more robust, you might be interested in [Express Simple Router](https://github.com/ethanresnick/express-simple-router). For authentication, check out [Express Simple Firewall](https://github.com/ethanresnick/express-simple-firewall).

## Adapters
An adapter handles all the interaction with the database. It is responsible for turning requests into standard [`Resource`](https://github.com/ethanresnick/json-api/blob/master/lib/types/Resource.ls) or [`Collection`](https://github.com/ethanresnick/json-api/blob/master/lib/types/Collection.ls) objects that the rest of the library will use. See the built-in [MongooseAdapter](https://github.com/ethanresnick/json-api/blob/master/lib/adapters/MongooseAdapter.ls) for an example.

