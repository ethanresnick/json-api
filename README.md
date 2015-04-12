json-api ![CircleCI Badge](https://circleci.com/gh/ethanresnick/json-api.png?0d6d9ba9db7f15eb6363c6fd93408526bef06035&style=shield)
========

This library creates a [JSON API](http://jsonapi.org/)-compliant REST API from your Node app. And it generates API documentation automatically.

It currently integrates with [Express](http://expressjs.com/) apps that use [Mongoose](http://mongoosejs.com/) models, but it can easily be integrated with other frameworks and databases. If you want to see an integration with another stack, just open an issue!

*Heads up:* The JSON-API spec isn't quite at version 1.0 yet, nor does this library yet implement the whole spec. In particular,  some advanced routes do not work and the library's API is subject to change. That said, all the basic CRUD operations are supported and development is progressing very quickly. The goal is to have the entire spec implemented by the time the final JSON API spec is officially released.

# Installation
```$ npm install json-api```

*On Versioning*: After the JSON API spec is finalized, this library's major version will be bumped to 3.0.0 and it will use semantic versioning going forward. Until then, the 2.x versions should be considered like this library's second "major version zero"—which is needed only because the 1.0 version of this library was stable and used in production for a while.

# Example API
Check out the [full, working example repo](http://github.com/ethanresnick/json-api-example) for all the details on building an API with this library. Or, take a look at the basic example below:

```javascript
  var app = require('express')()
    , API = require('json-api');

  var models = {
    "Person": require('./models/person'),
    "Place": require('./models/place')
  };

  var registry = new API.ResourceTypeRegistry();
  var adapter = new API.adapters.Mongoose(models);

  registry.type("people", {
    adapter: adapter,
    urlTemplates: {
      "self": "/people/{id}"
    }
  });

  registry.type("places", {
    adapter: adapter,
    urlTemplates: {"self": "/places/{id}"}
  });

  // Initialize the automatic documentation.
  // Note: don't do this til after you've registered all your resources.
  var templatePath = path.resolve(__dirname, './public/views/style-docs.jade')
  var DocsController = new API.controllers.Documentation(registry, {name: 'Example API'}, templatePath);
  
  // Set up our controllers
  var APIController = new API.controllers.API(registry);
  var Front = new API.controllers.Front(APIController, DocsController);
  var requestHandler = Front.apiRequest.bind(Front);

  app.get("/:type(people|places)", requestHandler);
  app.get("/:type(people|places)/:id", requestHandler);
  app.post("/:type(people|places)", requestHandler);
  app.patch("/:type(people|places)/:id", requestHandler);
  app.delete("/:type(people|places)/:id", requestHandler);

  app.listen(3000);
  ```

# Core Concepts
## Resource Type Descriptions <a name="resource-type-descriptions"></a>
The JSON-API spec is built around the idea of typed resource collections. For example, you can have a `"people"` collection and a `"companies"` collection. (By convention, type names are plural and lowercase.)

To use this library, you describe the special behavior (if any) that resources of each type should have, and then register that description with a central `ResourceTypeRegistry`. Then the library takes care of the rest. A resource type description is simply an object with the following properties:

- `urlTemplates`: an object containing the url templates for related to the resource. Currently, the only key supported is "self", which defines the template for building a link to single resources of that type.
- `adapter`: the [adapter](#adapters) used to find and update these resources. By specifying this for each resource type, different resource types can live in different kinds of databases.
- <a name="before-render"></a>`beforeRender` (optional): a function called on each resource after it's found by the adapter but before it's sent to the client. This lets you do things like hide fields that some users aren't authorized to see.
- <a name="before-save"></a>`beforeSave` (optional): a function called on each resource provided by the client (i.e. in a `POST` or `PUT` request) before it's sent to the adapter for saving. You can transform the data here to make it valid.
- <a name="labels"></a>`labelMappers` (optional): this lets you create urls (or, in REST terminology, resources) that map to different database items over time. For example, you could have a `/events/upcoming` resource or a `/users/me` resource. In those examples, "upcoming" and "me" are called the labels and, in labelMappers, you provide a function that maps each label to the proper database id(s) at any given time. The function can return a Promise if needed.

## Routing, Authentication & Controllers
This library gives you a base API controller (shown in the example) and a `Documentation` controller, but it doesn't prescribe how requests get to these controllers. This allows you to use any url scheme, routing layer, or authentication system you already have in place. You just need to make sure `req.params.type` reflects the requested resource type, and `req.params.id` or (if you want to allow labels on a request) `req.params.idOrLabel` reflects the requested id, if any. In the example above, routing is handled with Express's built-in `app[VERB]` methods. If you're looking for something more robust, you might be interested in [Express Simple Router](https://github.com/ethanresnick/express-simple-router). For authentication, check out [Express Simple Firewall](https://github.com/ethanresnick/express-simple-firewall).

## Adapters
An adapter handles all the interaction with the database. It is responsible for turning requests into standard [`Resource`](https://github.com/ethanresnick/json-api/blob/master/src/types/Resource.js) or [`Collection`](https://github.com/ethanresnick/json-api/blob/master/src/types/Collection.js) objects that the rest of the library will use. See the built-in [MongooseAdapter](https://github.com/ethanresnick/json-api/blob/master/src/adapters/Mongoose/MongooseAdapter.js) for an example.

