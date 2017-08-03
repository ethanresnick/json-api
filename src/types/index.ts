import Linkage, { LinkageJSON } from './Linkage';
import { IncomingMessage } from "http";
import Document from './Document';
import Resource from './Resource';
import Collection from './Collection';
import APIError from "./APIError";

export type PrimaryData = Resource | Collection | null | Linkage;
export type PrimaryDataJSON = Resource | Collection | null | LinkageJSON;
export type PrimaryDataOrErrors = PrimaryData | APIError[];

export const requestValidMethods = ["patch", "post", "delete", "get"];

// The type of value that a primary key is, as used 
// in our queries and requests. This goes into the adapter.
// (Could be something different inside the adapter.)
export type PrimaryKey = string;

export type Request = Readonly<{
  method: string;
  uri: {
    protocol: string;
    host: string;
    pathname: string;
    queryParams: object; 
  }
  headers: {
    contentType?: { type: string, parameters?: object };
    accepts?: string; // parsed somehow
  }
  body?: any;
  frameworkParams: {
    type: string;
    relationship?: boolean;
    label?: string;
    id?: string;
    idOrLabel?: string;
  }
  frameworkReq: IncomingMessage
}>;

export type ValidatedRequest = Request & Readonly<{
  method: "patch" | "post" | "delete" | "get";
  body?: { data: object }
  headers: {
    contentType?: { type: "application/vnd.api+json" }
  }
}>;

export type QueryFindResult = {
  primary: Resource | Collection | null,
  included?: Collection
};

export type FindCriteria = 
  ProjectionCriteria & PaginationAndSortingCriteria & WhereCriteria & ForbiddenCriteria;

export type Query = {
  method: "find";
  // Note: specifying fields in criteria means that subtypes
  // (specified with a discriminator keys on a single table/collection
  // in mongo or SQL) can't be rendered with a different JSON:API type,
  // because we wouldn't know what fields to return for records that match
  // a subtype. In other words, if: 
  //    1. we have a query like 
  //       { using: "people", criteria: { "select": ["name"] } }; and
  // 
  //    2. when that runs, it returns some records that, because of the 
  //       value of their discriminator key, are actually, say, "managers",
  //       or some other people subtype; and
  //
  //    3. we were to render in JSON:API the managers as `"type": "managers"`
  //       and the non-subtypes as `"type": "people"`; then:
  //
  //    4. we'd have a problem, under the current query format, serving the
  //       request GET /people?fields[people]=name&fields[managers]=name,dob
  //       because there'd be no way to represent that the subtype should get
  //       these different fields.
  //
  // To work around the problem of 4, we could change the query type's format
  // but, given that putting a subtype into the JSON:API type key is probably
  // an anti-pattern anyway (because type is part of an object's identity so, 
  // if you want to introduce a new subtype later you can't move any of the 
  // existing resources to that subtype), I've instead decided to solve this
  // by requiring that the subtypes (managers etc) be output with type: people
  // too (with extra info on their possibly-growing-over-time list of subtypes
  // then specified in meta). This works around the problem nicely imo, even if
  // it does give slightly less power to the sparse fieldsets.
  // See https://github.com/json-api/json-api/issues/862
  criteria: FindCriteria;
  populates: {
    [includePath: string]: true | FindCriteria;
  };
  returning: (queryResult: QueryFindResult, acc: Partial<Document>) => Partial<Document>;
} | {
  method: "create";
  // check for presence of records during validation.
  // replaces needsBody
  records: [object];
} | {
  method: "update";
  // check for presence of updates during validation.
  // replaces needsBody
  criteria: ForbiddenCriteria;
} | {
  method: "destroy";
  criteria: ForbiddenCriteria;
} | {
  method: "count";
  criteria: ForbiddenCriteria;
} | {
  method: "avg";
  numericAttrName: string;
  criteria: ForbiddenCriteria;
} | {
  method: "sum";
  numericAttrName: string;
  criteria: ForbiddenCriteria;
} | {
  method: "findRelationship",
  resourceId: string;
  relationshipName: string;
} | {
  // waterline calls these addToCollection and removeFromCollection,
  // but I've renamed them to be more consistent with JSON:API parlance.
  // likewise, I've renamed waterline's targetRecordsId to resourceId and
  // associatedIds to linkage.
  // See https://github.com/balderdashy/waterline/blob/master/lib/waterline/methods/remove-from-collection.js
  // https://github.com/balderdashy/waterline/blob/master/lib/waterline/methods/add-to-collection.js
  method: "addToRelationship"
  resourceId: string | number;
  relationshipName: string;
  linkage: Linkage;
} | {
  // can't combine this with the type above or ts gets confused.
  method: "removeFromRelationship"
  resourceId: string | number;
  relationshipName: string;
  linkage: Linkage;
} & {
  meta?: object;

  // using specifies the collection to query; also effects which adapter we use.
  // in the future, this could be an extension's url.
  using: string;

  // We need some way to know where the result of a query should 
  // end up in our response document. For example, it might be that
  // a given query just updates the inverse side of a relationship
  // and its result should be discarded. Or, it might be that the
  // result should end up in meta somewhere because it's an extension's
  // data. Or, it might be that the result should be divided between
  // `data` and `included`, as is the case with the result from our
  // main queries. So, we set up the returning property, which defines
  // a function that maps the query result to a partial document 
  // (indicating where the result should go). This function is given
  // the document that's been built so far -- we're reducing to a single
  // document as we get new query results, processing each partial 
  // document's resources through beforeRender -- but it usually shouldn't
  // need it. Also, returning isn't itself a reducer function, as we
  // don't want it to have to worry about how to do document merging
  // (e.g. removing duplicate resources). Instead, we'll take a bunch of
  // partial documents, and reduce them ourselves accroding to JSON:API
  // rules (like not allowing errors and data in the same response, etc).
  returning: (queryResult: any, acc: Partial<Document>) => Partial<Document>;
};

export type ForbiddenCriteria = {
  // various aggregation keys are unsupported, and we want 
  // to signal that explicitly. use a method instead, where possible.
  sum: undefined;
  groupBy: undefined;
  average: undefined;
}

export type ProjectionCriteria = {
  select: string[];
  omit: string[];
};

export type Sort = {[fieldName: string]: 'ASC' | 'DESC'};

export type PaginationAndSortingCriteria = {
  skip?: number;

  // todo: normalize null and Infinity to (Number.MAX_SAFE_INTEGER||9007199254740991)
  limit?: number | null;
  sort?: Sort[];
}

export type WhereCriteria = {
  // where is always defined, even if it's an empty object.
  // todo: normalize where clause to simpify predicates, possibly after every transformation??
  // https://github.com/balderdashy/waterline/blob/master/lib/waterline/utils/query/private/normalize-where-clause.js
  where: AndPredicate | OrPredicate;
};

export type AndPredicate = { and: Constraint[]; or: undefined };
export type OrPredicate = { or: Constraint[]; and: undefined };
export type Constraint = AndPredicate | OrPredicate | { 
  [fieldName: string]: number | string | boolean | {
    in: string[] | number[]
  } | {
    nin: string[] | number[]
  } | {
    '<': string | number
  } | {
    '<=': string | number
  } | {
    '>': string | number
  } | {
    '>=': string | number
  } | {
    '!=': string | number
  } | {
    like: string | number
  } | {
    contains: string | number
  } | {
    startsWith: string | number
  } | {
    endsWith: string | number
  }
}

// type Adapter = {
//   /* static */ getSchema(...args: any[]): typeof Resource.schema;
// }

// type Resource = {
//   dbAdapter: Adapter,

//   // some way to customize the incoming query if it
//   // targets this resource type? that's what beforeSave has been...but what form.

//   // how to have permissions at the field and type level (read only, write only, readwrite, etc).

//   // defaults for sorting, filtering, sparse fieldsets, includes

//   // maybe settings like whether to fetch before update?
//   // validation?? maybe just define one validate() function here that
//   // acts as a hook, with the assumption that it'll call mongoose.validate()?

//   // if we were gonna do a full permissions system, we'd store
//   // here whether the user can create, read, update, and delete
//   // the resource type. note that this might be a function of the
//   // user's roles (not dependent on the request body) or a function
//   // of the request's body. for example, suppose we have a document
//   // model: { name: "my document", folder: `link to folder 1` }.
//   // whether the user can create this document might depend on whether
//   // they have write access to folder 1 in particular. likewise, if
//   // they were trying to update the document, whether that was allowed
//   // would depend on the folder they were trying to move it to.
//   // similarly, whether a given document is viewable depends on the
//   // particular folder that document is in (so we'd probably want to
//   // block access to /documents and require /users/me?include=folders.documents)
//   // by contrast, a user on the tech@nyu api can create an event or not;
//   // we don't need to know anything about the event's contents. (though
//   // we could have just as easily had a world where an event can only
//   // be created for a team the user's on.) so, maybe the solution here
//   // is to take properties like the below:
//   permissions: {
//     // if false is provided below, incoming queries are edited to reject 
//     // if there's any attempt to create a record of the given type. 
//     // if a function is provided that's just a function of the request, 
//     // it's run once if the return value is false the same thing happens 
//     // as if false was specified directly. if a function of the proposed
//     // record is provided, it's run for every creation record in the query,
//     // and the request is failed if any fail. note: because determining
//     // whether a given proposed record can be created might require a db
//     // lookup (see example above), there's some asynchrony here.
//     create: boolean
//       | { (frameworkReq: any): Promise<boolean> }
//       | { (frameworkReq: any): Promise<{ (proposedRecord: object): Promise<boolean>}> };
//     update: /* would be same as above */ any;
//     destroy: /* would be same as above */ any;

//     // called read instaed of find because this is about whether they
//     // can read this type at all, whereas find sounds more like *how*
//     // they can search for instances of this type (like allowed filters).
//     // 
//     // should the read function get 'fromIncludePath=path' as an arg?
//     read: false;

//     /* here's an example of a few create implementations:
//     function(req) {
//       return Promise.resolve(req.user && req.user.hasRole("EXECUTIVE"));
//     }
    
//     function(req) {
//       if(!req.user) {
//         return Promise.resolve(false);
//       }

//       let foldersUserHasAccessTo = Folders.find({ owner: req.user.id }).exec();

//       return Promise.resolve(function(proposedResource) {
//         return foldersUserHasAccessTo.includes(proposedResource.relationships.folder);
//       });
//     }
//     */

//     // The problem with the above is that the user will have to remember to
//     // put the exact same folder check in the update method. So better to 
//     // specify this at the field level, maybe? 

//     // Or, what if we didn't allow body-content-based checks for create/update,
//     // but instead had a "set" check that we ran on both create and update based
//     // on the content. we'd also have a "get" test for field visibility, maybe??? 
//     // Something like:
//     canCreate: boolean | { (frameworkReq: any): Promise<boolean> };
//     canUpdate: boolean | { (frameworkReq: any): Promise<boolean> };
//     canDestroy: boolean
//       | { (frameworkReq: any): Promise<boolean> }
//       | { (frameworkReq: any): Promise<{ (proposedCriteria: QueryCriteria): Promise<boolean>}> };

//     canSet: { (frameworkReq: any): Promise<{ (proposedFields: object): Promise<boolean>}> };
//     /* then, canSet might look like:
//       function(req) {
//         let foldersUserHasAccessTo = req.user 
//           ? Folders.find({ owner: req.user.id }).exec()
//           : [1]; // 1 is a the public folder for unauthenticated users.

//         return Promise.resolve(function(proposedFields) {
//           return isEmpty(proposedFields.relationships.folder) || 
//             foldersUserHasAccessTo.includes(proposedFields.relationships.folder);
//         });
//       }
//     */

//     // More questions: should the functions above be able to pick a status code
//     // or return an error on failure, or just return a boolean? How do these
//     // functions actually differ from beforeSave at this point, which was called
//     // on create and update... (well, beforeSave didn't know whether it was
//     // being called on create or update, and it couldn't do async work once 
//     // and then return a promise for a function that would resolve synchronously, 
//     // which is a *huge* performance boost over doing the async work on each resource.)
//     // beforeSave was a better name, though, if we can only have one, as it could be 
//     // used to do validations or coercions on the query, not *just* enforce permissions.

  
//     // NOTE: Users must not be able to filter on fields they can't see, 
//     // as that leaks information. (User can try different filter values and
//     // see whether the resource remains in the result set.)

//     // maybe have relationship specific things here?
//   }

//   schema: {
//     // schema needs to store what the primary key is, so that it can
//     // be used in the query in populates etc.
//     //
//     // each field might have a way to declare whether it's visible,
//     // like:
//     // fieldName: {
//     //   type: String,
//     //   visible: 
//     //      - true or false (for always hidden or or always visible)
//     //      - a function of 
//     // }
//     // each field needs to store, if it's a relationship,
//     // which resource type it points to, so that that resource
//     // type's default fields etc can be applied to the 
//     //
//     [fieldName: string]: {
//       dbName: ""
//     }
//   }
// }

// // reducer.
// function merge(partialDocAcc, newPartialDoc) {
//   return mergedDartialDoc;
// }

// async function executeQueries(queryList) {
//   var initPartialDocument = {};
//   let partialDoc = await Promise.resolve(initPartialDocument);

//   for(let query of queryList) {
//     let queryResult = await executeQuery(query);
//     partialDoc = query.resulting(partialDoc, queryResult);
//   }

//   return partialDoc;
// }

// function executeQuery(query) {
//   return getAdapter(query.using).run(query);
// }

// // A request generates a query list, which is a list of lists of queries.
// // The outer list executes in parallel; queries in the same inner list 
// // execute serially. re transaction... not sure. maybe all the queries
// // should execute in a transaction? 
// type QueryList = Query[][];


// /*
// # transforms should be based on this idea of returning the same type, or error.
// # that shoudl be used to account for 

// # note: transducers are about more efficient transforms *over reducables*, where
// # those transforms can be specified in terms of single items. so, using transducers
// # to effect beforeSave/beforeRender makes sense for transforming collections; less so
// # for single resources (but we'll probably use it for collections and then apply the same
// # function to the single resource).
// Query for/on linkage => linkage | err/status
// Query for/on one resource => resource | error/status
// Query for/on collection => collection | error/status*/