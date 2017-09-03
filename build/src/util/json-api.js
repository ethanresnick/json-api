"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEMBER_NAME_REGEXP = /^[a-zA-Z0-9][a-zA-Z0-9\-_\u0020]*[a-zA-Z0-9]$/u;
function isValidMemberName(string) {
    return exports.MEMBER_NAME_REGEXP.test(string);
}
exports.isValidMemberName = isValidMemberName;
