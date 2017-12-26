"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const Data_1 = require("../../../src/types/Data");
describe("Data type", () => {
    const item1 = { "type": "a", "id": "1" };
    const item2 = { "type": "b", "id": "2" };
    const a = Data_1.default.of([item1, item2]);
    const b = Data_1.default.pure(item2);
    const aVal = a.value;
    const bVal = b.value;
    const emptyVal = Data_1.default.empty.value;
    const mapper = it => (Object.assign({}, it, { type: it.type + 'here' }));
    const asyncMapper = it => Promise.resolve(mapper(it));
    const toEmpty = it => Data_1.default.empty;
    const toPlural = (it) => Data_1.default.of([it]);
    const twice = it => Data_1.default.of([it, it]);
    const twiceAsync = it => Promise.resolve(twice(it));
    const toEmptyAsync = it => Promise.resolve(Data_1.default.empty);
    describe("map", () => {
        it("should run over each entry", () => {
            chai_1.expect(a.map(mapper).value.data).to.deep.equal([
                mapper(item1),
                mapper(item2)
            ]);
            const bMapped = b.map(mapper);
            chai_1.expect(bMapped.value.data).to.deep.equal([mapper(item2)]);
            chai_1.expect(bMapped.value.isSingular).to.be.true;
        });
    });
    describe("mapAsync", () => {
        it("should produce a promise for the result of a normal map", () => {
            return Promise.all([
                a.mapAsync(asyncMapper).then(mapped => {
                    chai_1.expect(mapped).to.deep.equal(a.map(mapper));
                }),
                b.mapAsync(asyncMapper).then(mapped => {
                    chai_1.expect(mapped).to.deep.equal(b.map(mapper));
                })
            ]);
        });
    });
    describe("flatMap", () => {
        it("should follow m >>= return ≡ m", () => {
            chai_1.expect(a.flatMap(Data_1.default.pure).value).to.deep.equal(aVal);
            chai_1.expect(b.flatMap(Data_1.default.pure).value).to.deep.equal(bVal);
        });
        it("should follow (return v) >>= f ≡ f v", () => {
            [toEmpty, toPlural, twice].forEach(flatMapCb => chai_1.expect(Data_1.default.pure(item1).flatMap(flatMapCb).value).to.deep.equal(flatMapCb(item1).value));
        });
        it("should follow (m >>= f) >>= g ≡ m >>= ( x -> (f x >>= g) )", () => {
            const pairs = [[toEmpty, toPlural], [twice, toPlural], [twice, toEmpty]];
            pairs.forEach(pair => {
                chai_1.expect(a.flatMap(pair[0]).flatMap(pair[1]).value).to.deep.equal(a.flatMap(x => pair[0](x).flatMap(pair[1])).value);
                chai_1.expect(b.flatMap(pair[0]).flatMap(pair[1]).value).to.deep.equal(b.flatMap(x => pair[0](x).flatMap(pair[1])).value);
            });
        });
    });
    describe("flatMapAsync", () => {
        it("should return a promise for the flatMap result", () => {
            return Promise.all([
                b.flatMapAsync(twiceAsync).then(mapped => chai_1.expect(mapped.value).to.deep.equal(b.flatMap(twice).value)),
                b.flatMapAsync(toEmptyAsync).then(mapped => chai_1.expect(mapped.value).to.deep.equal(b.flatMap(toEmpty).value)),
            ]);
        });
    });
    describe("empty", () => {
        it("should follow empty >>= f ≡ empty", () => {
            [toEmpty, toPlural, twice].forEach(fn => chai_1.expect(Data_1.default.empty.flatMap(fn).value).to.deep.equal(emptyVal));
        });
        it("should follow (m >>= (x -> empty)).data ≡ empty.data", () => {
            [a, b].forEach(m => chai_1.expect(m.flatMap(toEmpty).value.data).to.deep.equal(emptyVal.data));
        });
    });
});
