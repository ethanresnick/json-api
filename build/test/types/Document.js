"use strict";

var _interopRequire = require("babel-runtime/helpers/interop-require")["default"];

var mocha = _interopRequire(require("mocha"));

var sinon = _interopRequire(require("sinon"));

var chai = _interopRequire(require("chai"));

var Resource = _interopRequire(require("../../src/types/Resource"));

var Collection = _interopRequire(require("../../src/types/Collection"));

var Document = _interopRequire(require("../../src/types/Document"));

var expect = chai.expect;

describe("Document class", function () {
  describe("Rendering a document", function () {
    var person = new Resource("people", "31", { name: "mark" });
    var person2 = new Resource("people", "32", { name: "ethan" });
    var people = new Collection([person]);
    var topLevelMeta = { mcawesome: true };

    var singleResourceDocJSON = new Document(person, undefined, topLevelMeta).get();
    var collectionDocJSON = new Document(people, undefined, topLevelMeta).get();

    it("should key primary data under data, with each resource's type, id", function () {
      expect(singleResourceDocJSON.data).to.deep.equal({
        id: "31", type: "people", name: "mark"
      });
    });

    it("resource collections should be represented as arrays", function () {
      expect(collectionDocJSON.data).to.be.an("array");
    });

    it("should represent includes as an array under `included`", function () {
      expect(new Document(people, new Collection([person2])).get().included).to.deep.equal([{ id: "32", type: "people", name: "ethan" }]);
    });

    it("Should include a top-level self links", function () {
      var reqURI = "http://bob";
      var doc = new Document(people, [person2], undefined, undefined, reqURI);
      var docJSON = doc.get();

      expect(docJSON.links).to.be.an("object");
      expect(docJSON.links.self).to.equal(reqURI);
    });

    it("should output top-level meta information, iff provided", function () {
      var docWithoutMeta = new Document(people, [person2], undefined);
      expect(collectionDocJSON.meta).to.deep.equal(topLevelMeta);
      expect(docWithoutMeta.get().meta).to.be.undefined;
    });

    it("should reject non-object meta information", function () {
      expect(function () {
        return new Document(people, new Collection([person2]), ["bob"]);
      }).to["throw"](/meta.*object/i);
    });
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