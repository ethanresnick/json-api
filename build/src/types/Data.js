"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Data {
    constructor(value) {
        this.value = value;
    }
    flatMapHelper(newDatas) {
        const newValues = newDatas.map(it => it.value);
        const Constructor = this.constructor;
        return new Constructor(newValues.reduce((acc, it) => ({
            data: acc.data.concat(it.data),
            isSingular: acc.isSingular && it.isSingular
        }), {
            data: [],
            isSingular: this.value.isSingular
        }));
    }
    flatMap(fn) {
        return this.flatMapHelper(this.value.data.map(fn));
    }
    flatMapAsync(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.flatMapHelper(yield Promise.all(this.value.data.map(fn)));
        });
    }
    mapHelper(newValues) {
        const Constructor = this.constructor;
        return new Constructor({
            data: newValues,
            isSingular: this.value.isSingular
        });
    }
    map(fn) {
        return this.mapHelper(this.value.data.map(fn));
    }
    mapAsync(fn) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.mapHelper(yield Promise.all(this.value.data.map(fn)));
        });
    }
    every(fn) {
        return this.value.data.every(fn);
    }
    some(fn) {
        return this.value.data.some(fn);
    }
    forEach(fn) {
        this.value.data.forEach(fn);
        return this;
    }
    reduce(fn, initialValue) {
        return this.value.data.reduce(fn, initialValue);
    }
    filter(fn) {
        const Constructor = this.constructor;
        return new Constructor({
            data: this.value.data.filter(fn),
            isSingular: this.value.isSingular
        });
    }
    unwrap() {
        if (this.value.isSingular) {
            return this.value.data.length === 0 ? null : this.value.data[0];
        }
        return this.value.data;
    }
    get isSingular() {
        return this.value.isSingular;
    }
    get values() {
        return [...this.value.data];
    }
    get size() {
        return this.value.data.length;
    }
    static fromJSON(data) {
        return data === null
            ? this.empty
            : Array.isArray(data) ? this.of(data) : this.pure(data);
    }
    static of(data) {
        const Ctor = this || Data;
        return new Ctor({
            data: data,
            isSingular: false
        });
    }
    static pure(data) {
        const Ctor = this || Data;
        return new Ctor({
            data: [data],
            isSingular: true
        });
    }
}
Data.empty = new Data({ data: [], isSingular: true });
exports.default = Data;
