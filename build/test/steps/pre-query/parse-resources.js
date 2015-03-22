"use strict";

/*
  describe.skip("linkObjectFromJSON", () => {
    it.skip("should read in the incoming json correctly", () => {
      console.log("see https://github.com/json-api/json-api/issues/482");
    });
  });

  describe("resourceFromJSON", () => {
    it("should return a resource object", () => {
      expect(
        Document.resourceFromJSON({"type": "tests", "id": "1"})
      ).to.be.instanceof(Resource);
    });

    it("should load up the id, type, and attributes", () => {
      let json = {"id": "21", "type": "people", "name": "bob", "isBob": true};
      let resource = Document.resourceFromJSON(json);

      expect(resource.id).to.equal("21");
      expect(resource.type).to.equal("people");
      expect(resource.attrs).to.deep.equal({"name": "bob", "isBob": true});
    });

    it("should create LinkObjects for each link", () => {
      let parents = [{"type": "people", "id": "1"}, {"type": "people", "id": "2"}];
      let json = {
        "id": "3", "type": "people", "name": "Ethan",
        "links": {
          "parents": { "linkage": parents }
        }
      };
    });
  });
*/