json-api [![CircleCI Badge](https://circleci.com/gh/ethanresnick/json-api.png?0d6d9ba9db7f15eb6363c6fd93408526bef06035&style=shield)](https://circleci.com/gh/ethanresnick/json-api) [![Coverage Status](https://coveralls.io/repos/ethanresnick/json-api/badge.svg?branch=master&service=github)](https://coveralls.io/github/ethanresnick/json-api?branch=master)
========

This library creates a [JSON API](http://jsonapi.org/)-compliant REST API from your Node app and automatically generates API documentation.

It currently integrates with [Express](http://expressjs.com/) or Koa apps that use [Mongoose](http://mongoosejs.com/) models, but it can easily be integrated with other frameworks and databases. If you want to see an integration with another stack, just open an issue!

This library implements all the required portions of the 1.0 spec, which is more than enough for basic CRUD. It does not yet implement some of the smaller, optional pieces, like related resource URIs.

# V3 Beta Installation
```$ npm install json-api@next```

# Example API
Check out the [full, working v3 example repo](https://github.com/ethanresnick/json-api-example/tree/v3-wip) for all the details on building an API with this library. Or, take a look at the basic example below:

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

  // Tell the lib the host name our API is served from; needed for security.
  var opts = { host: 'example.com' }

  // Set up our controllers
  var APIController = new API.controllers.API(registry);
  var Front = new API.httpStrategies.Express(APIController, DocsController, opts);
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

- <a name="parentType"></a>`parentType` (optional): this allows you to designate one resource type being a sub-type of another (its `parentType`). This is often used when you have two resource types that live in the same database table/collection, and their type is determined with a discriminator key. See the [`schools` type](https://github.com/ethanresnick/json-api-example/blob/master/src/resource-descriptions/schools.js#L2) in the example repository. If a resource has a `parentType`, it inherits that type's configuration (i.e. its `urlTemplates`, `beforeSave`/`beforeRender` functions, and `info`). The only exception is that `labelMappers` are not inherited.

-  <a name="info"></a>`info` (optional): this allows you to provide extra information about the resource that will be included in the documentation. Available properties are `"description"` (a string describing what resources of this type are) and `"fields"`. `"fields"` holds an object in which you can describe each field in the resource (e.g. listing validation rules). See the [example implemenation](https://github.com/ethanresnick/json-api-example/blob/master/src/resource-descriptions/schools.js) for more details.

## Query Transforms
When a request comes in, the json-api library extracts various parameters from it to build a query that will be used to fulfill the user's request.

However, to support advanced use cases, you may want to transform the query that the library generates to select/update different data, or you might want to modify how the query's result (data or error) is placed into the JSON:API response. Query transforms let you do this. See an example in [here](https://github.com/ethanresnick/json-api-example/blob/v3-wip/src/index.js#L56).

One simple thing you can do with query transforms is to create urls (or, in REST terminology, resources) that map to different database items over time. For example, you could have an `/events/upcoming` resource or a `/users/me` resource. To do that, your query transform function would modifiy the libraries auto-generated query (which would likely be for all the events and users respectively) to add a filter constraint that only returns the appropriate resources.


## Filtering
This library supports filtering out of the box, using a syntax that's designed to be easier to read, and much easier to write, than the  square brackets syntax used by libraries like [qs](https://github.com/ljharb/qs).

For example, to include only items where the zip code is either 90210 or 10012, you'd write: 

`?filter=(zip,in,(90210,10012))`. 

By contrast, with the square-bracket syntax you'd have to write something like: 

`?filter[zip][in][]=90210&filter[zip][in][]=10012`.

### Formatting filtering constraints
In this library's default format, the value of the `filter` parameter is one or more "filter constraints" listed next to each other. These constraints narrow the results to only include those that match. The format of a filter constraint is: `(fieldName,operator,value)`. For example:

- `(name,eq,Bob)`: only include items where the name equals Bob
- `(salary,gte,150000)`: only include items where the salary is greater than or equal to 150,000.

If the value given is an integer, a float, `null`, `true`, or `false`, it is treated as a literal; every other value is treated as a string. If you want to express a string like "true", you can explicitly put it in single quotes, e.g.: `(street,eq,'true')`. To define a list of values, surround the values in parentheses and separate them with commas (e.g. `(90210,10012)` is a list of values used with the `in` operator above).

The valid operators (for the buit-in Mongoose adapter) are: `eq`, `neq`, `in`, `nin`, `lt`, `gt`, `lte`, and `gte`.

If you have multiple constraints, you can choose whether to combine them with an `AND` or an `OR`. To do that, instead of providing three items in your field constraint (i.e., the field name, operator, and value), provide only two: 1) `and` or `or`, and 2) a list of constraints. E.g.:

`GET /people?filter=(or,((name,eq,Bob)(zip,eq,90210)))`

Will find all the people who are named Bob or who live in the 90210 zip code.

Filter constraints listed next to each other at the top-level are combined with an "AND". E.g., `GET /people?filter=(name,Bob)(zip,90210)` will give only the people named Bob who live in the 90210 zip code.

Finally, as a shorthand, when the field name is not `and` or `or`, and the operator you want is `eq` (for equals), you can omit the operator entirely. E.g. `(name,Bob)` expresses the same constraint as `(name,eq,Bob)`. 

Putting it all together, you could do:

`GET /people?filter=(or,((email,test@example.com)(name,Test)))(dob,gte,1963)`

This will find everyone born after 1963 who also has either the name Test or the email test@example.com

Note: this filter query paramer format is entirely cusomizable, and other operators can be used if your adapter supports them. See MongooseAdapter's static properties and the ResourceTypeRegistry's constructor for details.

### On URL Encoding
When the value that you want to use in a filter constraint contains parentheses, commas, or single quotation marks, you must URL encode those characters so that the server doesn't interpret them as delimiters. Conversely, when those characters do appear as delimiters (e.g., the parentheses that surround each filter constraint, or the comma that separates the field name from the operator), they must NOT be url encoded.

Some clients automatically encode parentheses, commas, and single quotation marks in url query strings by default. This is incorrect behavior [per RFC 3986](https://tools.ietf.org/html/rfc3986#section-2.2), and it will cause the server to error, because it won't see the appropriate (unescaped) delimiter characters. Check your client for a setting to turn this behavior off.

## Pagination
Pagination limit and offset parameters are accepted in the following form:
```
?page[offset]=<value>&page[limit]=<value>
```
For example, to get 25 people starting at the 51st person:
```
GET /people?page[offset]=50&page[limit]=25
```

## Routing, Authentication & Controllers
This library gives you a Front controller (shown in the example) that can handle requests for API results or for the documentation. But the library doesn't prescribe how requests get to this controller. This allows you to use any url scheme, routing layer, or authentication system you already have in place. 

You just need to make sure that: `req.params.type` reflects the requested resource type; `req.params.id` reflects the requested id, if any; and `req.params.relationship` reflects the relationship name, in the event that the user is requesting a relationship url. The library will read these values to help it construct the query needed to fulfill the user's request.

In the example above, routing is handled with Express's built-in `app[VERB]` methods, and the three parameters are set properly using express's built-in `:param` syntax. If you're looking for something more robust, you might be interested in [Express Simple Router](https://github.com/ethanresnick/express-simple-router). For authentication, check out [Express Simple Firewall](https://github.com/ethanresnick/express-simple-firewall).

## Database Adapters
An adapter handles all the interaction with the database. It is responsible for turning requests into standard [`Resource`](https://github.com/ethanresnick/json-api/blob/master/src/types/Resource.ts) or [`Collection`](https://github.com/ethanresnick/json-api/blob/master/src/types/Collection.ts) objects that the rest of the library will use. See the built-in [MongooseAdapter](https://github.com/ethanresnick/json-api/blob/master/src/db-adapters/Mongoose/MongooseAdapter.ts) for an example.
