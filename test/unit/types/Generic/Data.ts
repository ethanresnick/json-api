import {expect} from "chai";
import Data from "../../../../src/types/Generic/Data";

describe("Data type", () => {
  const item1 = {"type": "a", "id": "1"};
  const item2 = {"type": "b", "id": "2"};

  const a = Data.of([item1, item2]);
  const b = Data.pure(item2);

  // These properties are private for users, but we read them in our tests.
  const aVal = (<any>a).value;
  const bVal = (<any>b).value;
  const emptyVal = (<any>Data.empty).value;

  // Callbacks
  const mapper = it => ({...it, type: it.type + 'here'});
  const asyncMapper = it => Promise.resolve(mapper(it));

  const toEmpty = it => Data.empty;
  const toPlural = (it) => Data.of([it]);
  const twice = it => Data.of([it, it]);
  const twiceAsync = it => Promise.resolve(twice(it));
  const toEmptyAsync = it => Promise.resolve(Data.empty);

  describe("map", () => {
    it("should run over each entry", () => {
      expect((<any>a.map(mapper)).value.data).to.deep.equal([
        mapper(item1),
        mapper(item2)
      ]);

      const bMapped = (<any>b.map(mapper));
      expect(bMapped.value.data).to.deep.equal([mapper(item2)]);
      expect(bMapped.value.isSingular).to.be.true;
    });
  });

  describe("mapAsync", () => {
    it("should produce a promise for the result of a normal map", () => {
      return Promise.all([
        a.mapAsync(asyncMapper).then(mapped => {
          expect(mapped).to.deep.equal(a.map(mapper))
        }),

        b.mapAsync(asyncMapper).then(mapped => {
          expect(mapped).to.deep.equal(b.map(mapper));
        })
      ]);
    });
  });

  describe("flatMap", () => {
    it("should follow m >>= return ≡ m", () => {
      expect((<any>a.flatMap(Data.pure)).value).to.deep.equal(aVal);
      expect((<any>b.flatMap(Data.pure)).value).to.deep.equal(bVal);
    });

    it("should follow (return v) >>= f ≡ f v", () => {
      [toEmpty, toPlural, twice].forEach(flatMapCb =>
        expect(
          (<any>Data.pure(item1).flatMap(flatMapCb)).value
        ).to.deep.equal(
          (<any>flatMapCb(item1)).value
        )
      );
    });

    it("should follow (m >>= f) >>= g ≡ m >>= ( x -> (f x >>= g) )", () => {
      const pairs = [[toEmpty, toPlural], [twice, toPlural], [twice, toEmpty]];
      pairs.forEach(pair => {
        expect(
          (<any>a.flatMap(pair[0]).flatMap(pair[1])).value
        ).to.deep.equal(
          (<any>a.flatMap(x => (<any>pair[0](x)).flatMap(pair[1]))).value
        )

        expect(
          (<any>b.flatMap(pair[0]).flatMap(pair[1])).value
        ).to.deep.equal(
          (<any>b.flatMap(x => (<any>pair[0](x)).flatMap(pair[1]))).value
        )
      });
    })
  });

  describe("flatMapAsync", () => {
    it("should return a promise for the flatMap result", () => {
      return Promise.all([
        (<any>b.flatMapAsync(twiceAsync)).then(mapped =>
          expect((<any>mapped).value).to.deep.equal((<any>b.flatMap(twice)).value)),

        (<any>b.flatMapAsync(toEmptyAsync)).then(mapped =>
          expect((<any>mapped).value).to.deep.equal((<any>b.flatMap(toEmpty)).value)),
      ]);
    })
  });

  describe("reduce", () => {
    it("should use the initialValue on empty data", () => {
      expect(Data.empty.reduce(it => it, 4)).to.equal(4);
    });

    it("should return undefined on empty data with no initialValue", () => {
      expect(Data.empty.reduce(it => it)).to.equal(undefined);
    });

    it("should work with no initialValue", () => {
      expect(Data.of([1, 2, 3]).reduce((acc, it) => acc + it)).to.equal(6);
    });

    it("should use the initialValue provided", () => {
      expect(Data.of([1, 2, 3]).reduce(((acc, it) => acc + it), 3)).to.equal(9);
      expect(Data.of([1, 2, 3]).reduce(((acc, it) => acc + it), "0")).to.equal("0123");
    });
  })

  describe("empty", () => {
    it("should follow empty >>= f ≡ empty", () => {
      [toEmpty, toPlural, twice].forEach(fn =>
        expect((<any>Data.empty.flatMap(fn)).value).to.deep.equal(emptyVal));
    });

    it("should follow (m >>= (x -> empty)).data ≡ empty.data", () => {
      // Below, we expect the data portion of the bound value to be equal,
      // but not the isSingular/links parts, which are `mappend`ed not reset.
      [a, b].forEach(m =>
        expect((<any>m.flatMap(toEmpty)).value.data).to.deep.equal(emptyVal.data));
    })
  })
});
