"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MaybeDataWithLinks_1 = require("./MaybeDataWithLinks");
const type_handling_1 = require("../util/type-handling");
class Relationship extends MaybeDataWithLinks_1.default {
    constructor(it) {
        super(it);
        this.owner = it.owner;
    }
    clone() {
        return this.constructor.of({
            data: this._data,
            links: this.links,
            owner: this.owner
        });
    }
    toJSON(fallbackTemplates) {
        const templateData = {
            "ownerType": this.owner.type,
            "ownerId": this.owner.id,
            "path": this.owner.path
        };
        const { data, links } = this.unwrapWith(it => it.toJSON(), templateData);
        const fallbackSelfTemplate = !links.self && fallbackTemplates.self;
        const fallbackRelatedTemplate = !links.related && fallbackTemplates.related;
        const finalLinks = Object.assign({}, links, (fallbackSelfTemplate ? { self: fallbackSelfTemplate(templateData) } : {}), (fallbackRelatedTemplate ? { related: fallbackRelatedTemplate(templateData) } : {}));
        return Object.assign({}, (typeof data !== 'undefined' ? { data } : {}), (type_handling_1.objectIsEmpty(finalLinks) ? {} : { links: finalLinks }));
    }
    static of(it) {
        return new this(it);
    }
}
exports.default = Relationship;
