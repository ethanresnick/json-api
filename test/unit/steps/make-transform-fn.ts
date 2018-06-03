import { expect } from "chai";
import { minimalDummyAdapter } from '../fixtures';
import Resource from "../../../src/types/Resource";
import ResourceIdentifier from "../../../src/types/ResourceIdentifier";
import ResourceTypeRegistry from "../../../src/ResourceTypeRegistry";
import sut from "../../../src/steps/make-transform-fn";

describe("makeTransformFn", () => {
  /* tslint:disable no-shadowed-variable */
  const registry = new ResourceTypeRegistry({
    "law-schools": {
      parentType: "schools",
      // schools doesn't have a beforeRender, so super below should be a noop
      async beforeRender(it, meta, extras, superFn) {
        it.lawSchools = true;
        return superFn(it, meta);
      }
    },
    "kindergartens": {
      parentType: "schools",
      transformLinkage: true,
      async beforeSave(it, meta, extras, superFn) {
        it.kindergartens = true;
        // intentionally don't pass along meta, so we can verify that it's
        // missing in the parent transform if the child doesn't provide it.
        return superFn(it);
      }
    },
    "schools": {
      parentType: "organizations",
      transformLinkage: false, // shouldn't effect anything.
      beforeSave(it, meta, extras, superFn) {
        it.schools = true;
        it.schoolSuper = superFn;
        it.schoolExtras = extras;
        it.schoolMeta = meta;
        return superFn(it, meta);
      },
      // Dont' define beforeRender here. Our law schools test relies on that.
      // Note: we have to explicitly make it undefined; else the beforeRender
      // from organizations gets inherited by the standard registry logic.
      beforeRender: undefined
    },
    "organizations": {
      transformLinkage: true,
      // this is a root type, so super below should be a noop
      beforeSave(it, meta, extras, superFn) {
        it.organizations = true;
        return superFn(it, meta);
      },
      async beforeRender(it, meta, extras, superFn) {
        it.organizations = true;
        return it;
      }
    },
    "people": {
      transformLinkage: false
    },
    "incomes": {
      transformLinkage: false,
      async beforeRender(it, meta, extras, superFn) {
        it.incomes = true;
        return superFn(it, meta);
      },
      beforeSave(it, meta, extras, superFn) {
        it.incomes = true;
        return superFn(it, meta);
      }
    },
    "sponsorships": {
      parentType: "incomes",
      transformLinkage: true,
      beforeRender(it, meta, extras, superFn) {
        it.sponsorships = true;
        return superFn(it, meta);
      },
      async beforeSave(it, meta, extras, superFn) {
        it.sponsorships = true;
        return it; // NOTE lack of super call intentionally.
      }
    }
  }, {
    dbAdapter: minimalDummyAdapter
  });
  /* tslint:enable no-shadowed-variable */

  const makeWithTypePath = (klass) => (childTypeName) => {
    const res = new klass(registry.rootTypeNameOf(childTypeName), "2");
    res.typePath = registry.typePathTo(childTypeName);
    return res;
  };

  const makeResource = makeWithTypePath(Resource);
  const makeResourceId = makeWithTypePath(ResourceIdentifier);

  // Dummy meta we'll pass to all calls of the transform fn.
  // tslint:disable-next-line no-useless-cast
  const meta = { section: "included" as "included" };

  const extras = {
    registry,
    serverReq: { serverReq: true } as any,
    serverRes: { serverRes: true } as any,
    request: { libRequest: true } as any
  };

  describe("super function", () => {
    it("should be binary, with extras, superFn already bound", () => {
      const resource = makeResource("kindergartens");
      const transformFn = sut("beforeSave", extras);

      // If this below is true, the schools beforeSave was called with the
      // right extras parameter and a superFn parameter, even though it wasn't
      // provided explicitly when kindergartens' beforeSave called superFn.
      return transformFn(resource, meta).then(newResource => {
        expect((newResource as any).kindergartens).to.be.true;
        expect((newResource as any).schoolExtras).to.equal(extras);
        expect((newResource as any).schoolMeta).to.be.undefined;
        expect((newResource as any).schoolSuper).to.be.a("function");
      });
    });

    it("should call the parent transform, even many levels deep, and be a noop if at root type", () => {
      const resource = makeResource("kindergartens");
      const transformFn = sut("beforeSave", extras);

      return transformFn(resource, meta).then(newResource => {
        const { kindergartens, schools, organizations } = newResource as any;
        expect(kindergartens).to.be.true;
        expect(schools).to.be.true;
        expect(organizations).to.be.true;
      });
    });

    it("should be a noop if the parent type is missing the relevant transform", () => {
      const resource = makeResource("law-schools");
      const transformFn = sut("beforeRender", extras);

      return transformFn(resource, meta).then(newResource => {
        const { lawSchools, organizations } = newResource as any;
        expect(lawSchools).to.be.true;
        expect(organizations).to.be.undefined;
      });
    });

    it("should not run unless called explicitly by the child function", () => {
      const resource = makeResource("sponsorships");
      const transformFn = sut("beforeSave", extras);

      return transformFn(resource, meta).then(newResource => {
        expect(newResource).to.have.property("sponsorships", true);
        expect(newResource).to.not.have.property("incomes");
      });
    });
  });

  describe("transforming linkage", () => {
    it("should ignore the typesList when deciding whether and how to transform linkage", () => {
      // schools has transformLinkage false, but the root type (organizations)
      // has it true; conversely, sponshorships has it true, but the root type
      // (incomes) has it false. in both cases, only the root type's preference
      // should matter. But, even when the linkage is being transformed, the
      // typesList shouldn't effect which transform functions are run (its
      // always the root types that should be).
      const linkage1 = makeResourceId("schools");
      const linkage2 = makeResourceId("sponsorships");
      const linkage3 = makeResourceId("kindergartens");
      const saveTransformFn = sut("beforeSave", extras);
      const renderTransformFn = sut("beforeRender", extras);

      return Promise.all([
        saveTransformFn(linkage1, meta),
        renderTransformFn(linkage2, meta),
        saveTransformFn(linkage3, meta)
      ]).then(([newLinkage1, newLinkage2, newLinkage3]) => {
        expect(newLinkage1).to.have.property("organizations", true);
        expect(newLinkage1).to.not.have.property("schools");

        expect(newLinkage2).to.not.have.any.keys("incomes", "sponsorships");

        expect(newLinkage3).to.have.property("organizations", true);
        expect(newLinkage3).to.not.have.any.keys("schools", "kindergartens");
      });
    });
  });
});
