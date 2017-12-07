import Linkage, { LinkageJSON } from './Linkage';
import Resource from './Resource';
import Collection from './Collection';
import Document from "./Document";

export type PrimaryData = Resource | Collection | null | Linkage;
export type PrimaryDataJSON = Resource | Collection | null | LinkageJSON;

export type Sort = { field: string; direction: 'ASC' | 'DESC' };

export type Predicate = {
  operator: "and" | "or";
  value: (FieldConstraint | Predicate)[];
  field: undefined;
};

export type AndPredicate = Predicate & { operator: "and" };

export type FieldConstraint = ({
  operator: "eq" | 'neq' | 'ne'; // ne and neq are synonyms
  value: number | string | boolean
} | {
  operator: "in" | "nin";
  value: string[] | number[]
} | {
  operator: 'lt' | 'gt' | 'lte' | 'gte';
  value: string | number;
}/* | {
  operator: '$like'; // not supported in our mongo transform yet
  value: string;
}*/) & {
  field: string;
};

export type UrlTemplateFns = {
  [typeName: string]: {
    [linkName: string]: (data: any) => string
  }
};

// I'm gonna start introducing more intermediate representations
// so that Request and Response aren't so overloaded/constantly mutated.
export type Request = {
  // The parsed json of the body; undefined if the HTTP body is an empty string.
  body: any | undefined;

  // Basic http fields/headers for the request
  method: string;
  uri: string;
  contentType: string | undefined;
  accepts: string | undefined;
  rawQueryString: string | undefined;

  // The query params on the request, parsed (likely with qs initially).
  // (May be further parsed post creation with JSON:API specific parsers.)
  queryParams: { [paramName: string]: any };

  // JSON:API specific parameters from the url.

  // Note: because of requests like /people/1/author, the type and id
  // stored here may not be that of the returned resourses.
  type: string;
  id: string | undefined;

  // The relationship name provided in the request's url. This is the
  // "author" part in the example /people/1/author request noted above.
  relationship: string | undefined;

  // Whether the target of the request is a relationship (object), as opposed
  // to a resource object or collection. This effects how incoming data is
  // parsed. E.g., this is true for /people/1/relationships/author but not
  // for /people/1/author
  aboutRelationship: boolean;

  // The prop below will be used in the future with the JSON:API ext system.
  //ext: string[];

  // Any primary data included in the request's body.
  // Necessary for creating and updating our resources.
  // Not present when request first created (parsed later from body).
  primary?: any;
}

// Result is different than HTTPResponse in that it contains details of the
// result that are salient for JSON:API, not structured in HTTP terms.
export type Result = {
  // headers should not include Content-Type,
  // which is assumed to be JSON:API.
  headers?: { [headerName: string]: string };
  ext?: string[];
  status?: number;
  document?: Document
}

export interface HTTPResponse {
  // Note: header names are all lowercase.
  // I've enumerated them here to get better type checking.
  // If you're adding custom headers, you probably want to extend this type.
  headers: {
    "content-type"?: string;
    vary?: string;
  },
  status: number;
  body?: string;
}
