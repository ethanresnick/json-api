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
 
  var Registry = new API.ResourceTypeRegistry();
  var Controller = new API.controllers.Base(Registry);
  var Adapter = new API.adapters.Mongoose(models);
  
  Registry.type("people", {
    adapter: Adapter,
    urlTemplates: {
      "people": "/people/{people.id}",
      "people.primaryResidence": "/places/{people.primaryResidence}"
    }
  });
  
  Registry.type("places", {
    adapter: Adapter,
    urlTemplates: {"places": "/places/{places.id}"}
  });
  
  app.get("/:type(people,places)", Controller.GET);
  app.get("/:type(people,places)/:id", Controller.GET);
  app.post("/:type(people,places)", Controller.POST);
  app.put("/:type(people,places)/:id", Controller.PUT);
  app.delete("/:type(people,places)/:id", Controller.DELETE);
  
  app.listen(3000);
  ```
