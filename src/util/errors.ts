import APIError, { Opts } from '../types/APIError';

export type Diff<T extends string, U extends string> =
  ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];

export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;
export type ErrorOpts = Omit<Opts, "title" | "status" | "typeUri" | "code">;

/*
 * "Generic" Errors
 *
 * These are errors that are no more specific/meaningful than their status
 * code. They don't have/need a typeUri, in the same way problem+json uses
 * "about:blank" for the analogous concept.
 *
 * Note: in all the functions below, we override data for status, title,
 * and typeUri because these must (by definition) be the same for every
 * ocurrence of the error.
 */

export const genericValidation = (data?: ErrorOpts) =>
  new APIError({ ...data, status: 400, title: "Invalid data." });

export const genericNotFound = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 404,
    title: "One or more of the targeted resources could not be found.",
  });

export const generic405 = (data?: ErrorOpts) =>
  new APIError({ ...data, status: 405, title: "Method not supported." })

export const generic406 = (data?: ErrorOpts) =>
  new APIError({ ...data, status: 406, title: "Not Acceptable" });

export const generic415 = (data?: ErrorOpts) =>
  new APIError({ ...data, status: 415, title: "Invalid Media Type" });



/*
 * Query param/url related errors.
 */

export const invalidIncludePath = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/invalid-include-path",
    title: "Invalid include path.",
  });

export const unsupportedIncludePath = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/unsupported-include-path",
    title: "Unsupported include path."
  });

export const illegalQueryParam = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/illegal-query-param",
    title: "One or more of the query parameters you provided is not allowed at this url.",
  });

export const invalidQueryParamValue = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/invalid-query-param-value",
    title: "One or more of the query parameters you provided has an invalid value."
  });



/*
 * Request body-derived errors.
 */

export const illegalTypeList = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/illegal-types-list",
    title: "You cannot provide a list of (sub)-types on this request."
  });

export const invalidTypeList = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/invalid-types-list",
    title: "Invalid list of types."
  });

export const invalidResourceType = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/invalid-resource-type",
    title: "One or more of the provided/targeted resources is of a type " +
      "that's invalid (at least at this endpoint)."
  });

export const invalidRelationshipName = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/invalid-relationship-name",
    title: "A provided relationhsip name is not valid (at least on this resource)."
  });

export const invalidAttributeName = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/invalid-attribute-name",
    title: "A provided attribute is not valid (at least on this resource)."
  });

export const invalidLinkageStructure = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/invalid-linkage-json",
    title: "Part of the provided JSON was expected to be a resource " +
      "identifier object, but wasn't. Verify you have a { type, id } structure."
  });

/**
 * This is a catch-all error for cases when the resource object in question
 * would be invalid in ANY json:api API.
 * @type {[type]}
 */
export const invalidResourceStructure = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/resource-object-invalid-json",
    title: "Invalid resource object structure."
  });

export const resourceMissingTypeKey = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/resource-missing-type",
    title: "Provided resource object was missing the required `type` key."
  });

export const resourceMissingIdKey = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/resource-missing-id",
    title: "A provided resource object was missing a required `id` key."
  });

export const resourceMetaNonObject = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/resource-meta-non-object",
    title: "Provided resource object had a `meta` value that wasn't an object."
  });

export const resourceFieldsContainerNonObject = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/resource-fields-container-non-object",
    title: "Provided resource object had an `attributes` or `relationships` value that wasn't an object."
  });

export const resourceIdentifierKeyAsField = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/resource-identifier-key-used-as-field",
    title: "Resource objects cannot use `type` or `id` as a field."
  });

export const resourceDuplicateField = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/resource-duplicate-field",
    title: "Resource objects can't have an attribute and a relationship with the same name."
  });

export const relationshipMissingLinkage = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/relationship-missing-linkage",
    title: "Client-sent relationship objects must include `data`."
  });

export const invalidLinkageType = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/invalid-linkage-type",
    title: "One or more of the provided resource identifier objects is of a " +
      "type that's invalid in the targeted relationship."
  });

/**
 * Picks out field names that are illegal per the particular rules of this API
 * and/or resource type. Could also apply to field names that are illegal per
 * JSON:API, but, if you have to pick only one error to use, there are generally
 * better ones for the latter case.
 */
export const illegalFieldName = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/illegal-field-name",
    title: "One or more of the fields provided is not a legal field name this resource."
  })

export const unsupportedClientId = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 403,
    typeUri: "https://jsonapi.js.org/errors/unsupported-client-id",
    title: "Client-generated ids are not supported."
  })

export const invalidFieldValue = (data?: ErrorOpts) =>
  new APIError({
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/invalid-field-value",
    title: "Invalid field value."
  })

export const missingDataKey = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/missing-data-key",
    title: "Request body is missing the top-level JSON:API `data` key."
  });

export const expectedDataArray = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/expected-data-array",
    title: "The JSON:API `data` key must hold an array for this request."
  });

export const expectedDataObject = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/expected-data-object",
    title: "The JSON:API `data` key must hold an object, not an array, for this request."
  });

export const jsonParse = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/json-parse-error",
    title: "Request is not valid JSON."
  });

export const uniqueViolation = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 409,
    typeUri: "https://jsonapi.js.org/errors/unique-error",
    title: "This resource/update contained some data that was the same as " +
      "data in another resource of the same type, but was supposed to be unique."
  });



/*
 * Errors that could be body or url related.
 */

export const invalidId = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 400,
    typeUri: "https://jsonapi.js.org/errors/invalid-id",
    title: "One or more of the provided resource ids is invalid."
  });

export const unknownResourceType = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 404,
    typeUri: "https://jsonapi.js.org/errors/unknown-resource-type",
    title: 'Unknown resource type.'
  });

export const unknownRelationshipName = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 404,
    typeUri: "https://jsonapi.js.org/errors/unknown-relationship-name",
    title: 'Unknown relationship name.'
  });



/*
 * Other error types.
 */

export const occFail = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 409,
    typeUri: "https://jsonapi.js.org/errors/optimistic-concurrency-check-failed",
    title: "One or more of the resources you are trying to use was either " +
      "changed or was deleted while you were trying to read/update it. Try again."
  });

export const invalidMediaTypeParam = (data?: ErrorOpts) =>
  new APIError({
    ...data,
    status: 415,
    typeUri: "https://jsonapi.js.org/errors/invalid-media-type-parameter",
    title: "Invalid Media Type Parameter"
  })
