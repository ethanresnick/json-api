"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var mocha = _interopRequire(require("mocha"));

var sinon = _interopRequire(require("sinon"));

var chai = _interopRequire(require("chai"));

var Resource = _interopRequire(require("../../src/types/Resource"));

var Collection = _interopRequire(require("../../src/types/Collection"));

var Document = _interopRequire(require("../../src/types/Document"));

var expect = chai.expect;

describe("Document class", function () {
  describe("resourceFromJSON", function () {
    it("should return a resource object", function () {
      expect(Document.resourceFromJSON({ type: "tests", id: "1" })).to.be["instanceof"](Resource);
    });

    it("should load up the id, type, and attributes", function () {
      var json = { id: "21", type: "people", name: "bob", isBob: true };
      var resource = Document.resourceFromJSON(json);

      expect(resource.id).to.equal("21");
      expect(resource.type).to.equal("people");
      expect(resource.attrs).to.deep.equal({ name: "bob", isBob: true });
    });

    it.skip("should create LinkObjects for each link", function () {});
  });

  describe.skip("linkObjectFromJSON", function () {
    it.skip("should read in the incoming json correctly", function () {
      console.log("see https://github.com/json-api/json-api/issues/482");
    });
  });

  describe("Rendering a document", function () {
    var person = new Resource("people", "31", { name: "mark" });
    var person2 = new Resource("people", "32", { name: "ethan" });
    var people = new Collection([person]);

    it("primary data should be keyed under data", function () {
      expect(new Document(person).get().data).to.deep.equal({
        id: "31", type: "people", name: "mark"
      });
    });

    it("resource collections should be represented as arrays", function () {
      expect(new Document(people).get().data).to.deep.equal([{
        id: "31", type: "people", name: "mark"
      }]);
    });

    it("should represent includes as an array under `included`", function () {
      expect(new Document(people, [person2]).get().included).to.deep.equal([{ id: "32", type: "people", name: "ethan" }]);
    });

    it.skip("Should include appropriate top-level links.");
  });
});

/* TEST CASES
0 resources | toOne or toMany relationship, included or referenced by href
  - { type:[] }

1 resource | toMany relationship | included
  - {
    type: {
      "attrName": "val",
      "links": {
        propName: {
          "type": "type2",
          "ids": ["id2", "id3"]
        }
      }
    },
    linked: {
      //same as above
    }
  }


[1, n] resources | toOne relationship | referenced by href
  - {
      //identical to the included case below, sans the linked key
      links: {
        "type.propName": {
          type: "type2",
          href: "/type2/{id}"
        }
      },
      type: [
        {
          "attrName": "val",
          "links": {
            "propName": "id2"
          }
        },
        ...
      ]
    }

[1, n] resources | toMany relationship | included
  - {
      //add links so you dont have to specify type at each resource-level
      //links key. Has some overhead--most notably having to include the
      //url template, which isn't actually used--but pays off if the
      //response has more than a handful of resources.
      links: {
        "type.propName": {
          type: "type2",
          href: "/type2/id"
        }
      },
      type: [
        {
          "attrName": "val",
          "links": {
            "propName": ["id2", "id3"]
          }
        },
        ...
      ],
      linked: {
        type2: [{
          //full resource, sans type + href but with id.
        }]
      }
    }
*/

/*
let parents = [{"type": "people", "id": "1"}, {"type": "people", "id": "2"}];
console.log('see https://github.com/json-api/json-api/issues/482');
let json = {
  "id": "3", "type": "people", "name": "Ethan",
  "links": {
    "parents": { "linkage": parents }
  }
};*/