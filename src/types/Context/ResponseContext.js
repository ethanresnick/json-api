import {ValueObject} from "../util/utils"

let propDesc = {writable: true, enumerable: true};

class ResponseContext {
  constructor(initialValues) {
    // The JSON-API extensions used to formulate the response,
    // which affects the final the Content-Type header and our
    // validation of the client's `Accept` header.
    this.ext = [];

    // The response's errors. If it has some,
    // we render them instead of a standard document.
    this.errors = [];

    // The response's content type.
    this.contentType = null;

    // The response's status.
    this.status = null;

    // The JSON for the response body.
    this.body = null;

    // The response's primary data. Have to use
    // Object.defineProperty to default it to undefined
    // while allowing us to set it post seal().
    Object.defineProperty(this, "primary", propDesc);

    // The response's included resources.
    Object.defineProperty(this, "included", propDesc);

    // The response document's top-level links.
    Object.defineProperty(this, "links", propDesc);

    // The response document's top-level meta information.
    Object.defineProperty(this, "meta", propDesc);
  }
}

export default ValueObject(ResponseContext);
