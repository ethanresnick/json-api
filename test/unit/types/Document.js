import {expect} from "chai";
import Resource from "../../../src/types/Resource";
import Collection from "../../../src/types/Collection";
import Document from "../../../src/types/Document";
import ResourceTypeRegistry from "../../../src/ResourceTypeRegistry";

describe("Document class", () => {
  describe("Rendering a document", () => {
    const registry = new ResourceTypeRegistry([{ type: "people" }]);
    const person = new Resource("people", "31", {"name": "mark"});
    const person2 = new Resource("people", "32", {"name": "ethan"});
    const people = new Collection([person]);
    const topLevelMeta = {"mcawesome": true};

    const singleResourceDocJSON = new Document(person, undefined, topLevelMeta, registry).get();
    const collectionDocJSON = new Document(people, undefined, topLevelMeta, registry).get();

    it("should key primary data under data, with each resource's type, id", () => {
      expect(singleResourceDocJSON.data).to.deep.equal({
        "id": "31", "type": "people", "attributes": {"name": "mark"}
      });
    });

    it("resource collections should be represented as arrays", () => {
      expect(collectionDocJSON.data).to.be.an("array");
    });

    it("should represent includes as an array under `included`", () => {
      expect((new Document(people, new Collection([person2]), undefined, registry)).get().included)
        .to.deep.equal([{"id": "32", "type": "people", "attributes": {"name": "ethan"}}]);
    });

    it("Should include a top-level self links", () => {
      const reqURI = "http://bob";
      const doc = new Document(people, [person2], undefined, registry, reqURI);
      const docJSON = doc.get();

      expect(docJSON.links).to.be.an("object");
      expect(docJSON.links.self).to.equal(reqURI);
    });

    it("should output top-level meta information, iff provided", () => {
      const docWithoutMeta = new Document(people, [person2], undefined, registry);
      expect(collectionDocJSON.meta).to.deep.equal(topLevelMeta);
      expect(docWithoutMeta.get().meta).to.be.undefined;
    });

    it("should reject non-object meta information", () => {
      expect(() => new Document(people, new Collection([person2]), ["bob"]))
        .to.throw(/meta.*object/i);
    });
  });

});
