json-api [![CircleCI Badge](https://circleci.com/gh/ethanresnick/json-api.png?0d6d9ba9db7f15eb6363c6fd93408526bef06035&style=shield)](https://circleci.com/gh/ethanresnick/json-api) [![Coverage Status](https://coveralls.io/repos/ethanresnick/json-api/badge.svg?branch=master&service=github)](https://coveralls.io/github/ethanresnick/json-api?branch=master)
========

This library creates a [JSON API](http://jsonapi.org/)-compliant REST API from your Node app and automatically generates API documentation.

It currently integrates with [Express](http://expressjs.com/) apps that use [Mongoose](http://mongoosejs.com/) models, but it can easily be integrated with other frameworks and databases. If you want to see an integration with another stack, just open an issue!

This library implements all the required portions of the 1.0 spec, which is more than enough for basic CRUD. It does not yet implement some of the smaller, optional pieces, like pagination and related resource URIs.

# Installation
```$ npm install json-api```

*On Versioning*: This library's major version will soon be bumped to 3.0.0, and it will use semantic versioning after that. The 2.x branch does not use semantic versioning. However, even on 2.x versions, "patch updates" (i.e. changes the version's third integer) will always be backwards-compatible. Changes to the the minor version (i.e. the second integer) on the 2.x branch may not be.

# Example API
Check out the [full, working example repo](http://github.com/ethanresnick/json-api-example) for all the details on building an API with this library. Or, take a look at the basic example below:

```javascript
  var app = require('express')()
    , API = require('json-api');

  var models = {
    "Person": require('./models/person'),
    "Place": require('./models/place')
  };

  var adapter = new API.dbAdapters.Mongoose(models);
  var registry = new API.ResourceTypeRegistry({
    "people": {
      urlTemplates: {
        "self": "/people/{id}"
      },
      beforeRender: function(resource, req, res) {
        if(!userIsAdmin(req)) resource.removeAttr("password");
        return resource;
      }
    },
    "places": {
      urlTemplates: {"self": "/places/{id}"}
    }
  }, {
    "dbAdapter": adapter
  });

  // Initialize the automatic documentation.
  var DocsController = new API.controllers.Documentation(registry, {name: 'Example API'});

  // Set up our controllers
  var APIController = new API.controllers.API(registry);
  var Front = new API.httpStrategies.Express(APIController, DocsController);
  var requestHandler = Front.apiRequest.bind(Front);

  // Add routes for basic list, read, create, update, delete operations
  app.get("/:type(people|places)", requestHandler);
  app.get("/:type(people|places)/:id", requestHandler);
  app.post("/:type(people|places)", requestHandler);
  app.patch("/:type(people|places)/:id", requestHandler);
  app.delete("/:type(people|places)/:id", requestHandler);

  // Add routes for adding to, removing from, or updating resource relationships
  app.post("/:type(people|places)/:id/relationships/:relationship", requestHandler);
  app.patch("/:type(people|places)/:id/relationships/:relationship", requestHandler);
  app.delete("/:type(people|places)/:id/relationships/:relationship", requestHandler);


  app.listen(3000);
  ```

# Core Concepts
## Resource Type Descriptions <a name="resource-type-descriptions"></a>
The JSON-API spec is built around the idea of typed resource collections. For example, you can have a `"people"` collection and a `"companies"` collection. (By convention, type names are plural, lowercase, and dasherized.)

To use this library, you describe the special behavior (if any) that resources of each type should have, and then register those descriptions with a central `ResourceTypeRegistry`. Then the library takes care of the rest. Each resource type description is simply an object with the following properties:

- `urlTemplates`: an object containing url templates used to output the json for resources of the type being described. Currently, the supported keys are: `"self"`, which defines the template used for building [resource urls](http://jsonapi.org/format/#document-structure-resource-urls) of that type, and `"relationship"`, which defines the template that will be used for [relationship urls](http://jsonapi.org/format/#fetching-relationships).
- `dbAdapter`: the [database adapter](#database-adapters) to use to find and update these resources. By specifying this for each resource type, different resource types can live in different kinds of databases.

- <a name="before-render"></a>`beforeRender` (optional): a function called on each resource after it's found by the adapter but before it's sent to the client. This lets you do things like hide fields that some users aren't authorized to see. [Usage details](https://github.com/ethanresnick/json-api-example/blob/master/src/resource-descriptions/people.js#L7).

- <a name="before-save"></a>`beforeSave` (optional): a function called on each resource provided by the client (i.e. in a `POST` or `PATCH` request) before it's sent to the adapter for saving. You can transform the data here as necessary or pre-emptively reject the request. [Usage details](https://github.com/ethanresnick/json-api-example/blob/master/src/resource-descriptions/people.js#L25).

- <a name="labels"></a>`labelMappers` (optional): this lets you create urls (or, in REST terminology, resources) that map to different database items over time. For example, you could have an `/events/upcoming` resource or a `/users/me` resource. In those examples, "upcoming" and "me" are called the labels and, in labelMappers, you provide a function that maps each label to the proper database id(s) at any given time. The function can return a Promise if needed.

- <a name="parentType"></a>`parentType` (optional): this allows you to designate one resource type being a sub-type of another (its `parentType`). This is often used when you have two resource types that live in the same database table/collection, and their type is determined with a discriminator key. See the [`schools` type](https://github.com/ethanresnick/json-api-example/blob/master/src/resource-descriptions/schools.js#L2) in the example repository. If a resource has a `parentType`, it inherits that type's configuration (i.e. its `urlTemplates`, `beforeSave`/`beforeRender` functions, and `info`). The only exception is that `labelMappers` are not inherited.

-  <a name="info"></a>`info` (optional): this allows you to provide extra information about the resource that will be included in the documentation. Available properties are `"description"` (a string describing what resources of this type are) and `"fields"`. `"fields"` holds an object in which you can describe each field in the resource (e.g. listing validation rules). See the [example implemenation](https://github.com/ethanresnick/json-api-example/blob/master/src/resource-descriptions/schools.js) for more details.

## Filtering
This library includes basic filtering capabilities out of the box. Filters are accepted in the following form:
```
?filter[simple][<field_name>]=<value>
```
For example, to get all people with the name "John":
```
GET /people?filter[simple][name]=John
```
Also available are Mongo-specific operators, taking the following form:
```
?filter[simple][<field_name>][<operator>]=<value>
```
The `<operator>` can be set to any [Mongo query operator](http://docs.mongodb.org/manual/reference/operator/query/). For example, to get all jobs completed before June 2015:
```
GET /jobs?filter[simple][dateCompleted][$lt]=2015-06-01
```
Please note however that as these operators are Mongo-specific, they may be replaced in a future version with a more database-agnostic syntax.

## Routing, Authentication & Controllers
This library gives you a Front controller (shown in the example) that can handle requests for API results or for the documentation. But the library doesn't prescribe how requests get to this controller. This allows you to use any url scheme, routing layer, or authentication system you already have in place. You just need to make sure that: `req.params.type` reflects the requested resource type; `req.params.id` or (if you want to allow labels on a request) `req.params.idOrLabel` reflects the requested id, if any; and `req.params.relationship` reflects the relationship name, in the event that the user is requesting a relationship url.

In the example above, routing is handled with Express's built-in `app[VERB]` methods, and the three parameters are set properly using express's built-in `:param` syntax. If you're looking for something more robust, you might be interested in [Express Simple Router](https://github.com/ethanresnick/express-simple-router). For authentication, check out [Express Simple Firewall](https://github.com/ethanresnick/express-simple-firewall).

## Database Adapters
An adapter handles all the interaction with the database. It is responsible for turning requests into standard [`Resource`](https://github.com/ethanresnick/json-api/blob/master/src/types/Resource.js) or [`Collection`](https://github.com/ethanresnick/json-api/blob/master/src/types/Collection.js) objects that the rest of the library will use. See the built-in [MongooseAdapter](https://github.com/ethanresnick/json-api/blob/master/src/db-adapters/Mongoose/MongooseAdapter.js) for an example.
