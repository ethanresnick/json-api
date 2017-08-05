"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function deleteNested(path, object) {
    try {
        const pathParts = path.split(".");
        const lastPartIndex = pathParts.length - 1;
        const lastPart = pathParts[lastPartIndex];
        const containingParts = pathParts.slice(0, lastPartIndex);
        const container = containingParts.reduce(((obj, part) => obj[part]), object);
        if (container.hasOwnProperty(lastPart)) {
            delete container[lastPart];
            return true;
        }
        else {
            throw new Error("The last property in the path didn't exist on the object.");
        }
    }
    catch (error) {
        return false;
    }
}
exports.deleteNested = deleteNested;
function isSubsetOf(setArr, potentialSubsetArr) {
    const set = new Set(setArr);
    return potentialSubsetArr.every((it) => set.has(it) === true);
}
exports.isSubsetOf = isSubsetOf;
function isPlainObject(obj) {
    return typeof obj === "object" && !(Array.isArray(obj) || obj === null);
}
exports.isPlainObject = isPlainObject;
function pseudoTopSort(nodes, edges, roots) {
    roots = roots.slice();
    nodes = nodes.slice();
    edges = Object.assign({}, edges);
    for (const key in edges) {
        edges[key] = Object.assign({}, edges[key]);
    }
    const sortResult = [];
    while (roots.length) {
        const thisRoot = roots.shift();
        const thisRootChildren = edges[thisRoot] || {};
        sortResult.push(thisRoot);
        for (const child in thisRootChildren) {
            delete thisRootChildren[child];
            roots.push(child);
        }
    }
    return sortResult;
}
exports.pseudoTopSort = pseudoTopSort;
