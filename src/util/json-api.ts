// From http://jsonapi.org/format/#document-member-names, the technically valid member names would be:
// /^[a-zA-Z0-9\u0080-\u{10FFFF}][a-zA-Z0-9\u0080-\u{10FFFF}\-_\u0020]*[a-zA-Z0-9\u0080-\u{10FFFF}]$/u
// but I'm abridging this below considerablyfor simplicity. If it's a problem, I'll expand.
export const MEMBER_NAME_REGEXP = /^[a-zA-Z0-9][a-zA-Z0-9\-_\u0020]*[a-zA-Z0-9]$/u;

export function isValidMemberName(string: string) {
  return MEMBER_NAME_REGEXP.test(string);
}
