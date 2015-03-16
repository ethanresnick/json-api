import BaseContext from './BaseContext'

export default class ResponseContext extends BaseContext {
  constructor(initialValues) {
    // The JSON-API extensions used to formulate the response, 
    // which affects the final the Content-Type header and our 
    // validation of the client's `Accept` header.
    this.ext = [];

    // Whether the response should have a body. If not, we 204.
    this.hasBody = null;    

    // The response's errors. If it has some,
    // we render them instead of a standard document.
    this.errors = [];

    // The response's primary data.
    this.primary = null

    // The response's included resources.
    this.included = null;

    // The response document's top-level links.
    this.links = null;

    // The response document's top-level meta information.
    this.meta = null;

    return super(initialValues);
  }
}