import {ValueObject} from "../../util/type-handling";

class Request {
  constructor() {
    // Whether the request has a (non-empty) body,
    // in which case we'll need to validate the Content-Type.
    this.hasBody = null;

    // Whether the request is supposed to have a body.
    // If it needsBody but doesn't have one, it's invalid.
    this.needsBody = null;

    // The json of the body. Have to use Object.defineProperty to default
    // it to undefined while still allowing us to change it post seal().
    Object.defineProperty(this, "body", {writable: true, enumerable: true});

    // The HTTP method for the request.
    this.method = null;

    // The URI (or IRI) being requested.
    this.uri = null;

    // The request's Content-Type.
    this.contentType = null;

    // The request's Accept header.
    this.accepts = null;

    // The JSON-API extensions used to formulate the request,
    // read from the Content-Type header's `ext` param.
    this.ext = [];

    // Whether we can process the id in the url as a label for this request.
    this.allowLabel = false;

    // The id provided in the request's url, optionally after treating that
    // id as a label and mapping it to one or more entity ids. Note also:
    // the request could be something like /people/1/author, so the id(s)
    // stored here may not be the id(s) of the requested resource.
    this.idOrIds = null;

    // The type provided in the request's url. As above, requests like
    // /people/1/author imply that the type stored here may not be that
    // of the returned resourses.
    this.type = null;

    // The relationship name provided in the request's url. This is the
    // "author" part in the example /people/1/author request noted above.
    this.relationship = null;

    // Whether the target of the request is a relationship (object), as opposed
    // to a resource object or collection. This effects how incoming data is
    // parsed. Note: the body of the request will be Linkage rather than
    // Relationships, in the same way that POSTs targeting a collection
    // include a single resource.
    this.aboutRelationship = false;

    // Any primary data included in the request's body.
    // Necessary for creating and updating our resources.
    this.primary = null;

    // Query parameters that might influence the request.
    this.queryParams = {};
  }
}

export default ValueObject(Request); // eslint-disable-line new-cap
