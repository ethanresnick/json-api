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

    // The response's primary data. Starts at 0 because that's an invalid
    // value, allowing us to detect along the chain whether it's been set. 
    this.primary = 0;

    // The response's included resources.
    this.included = 0;

    // The response document's top-level links.
    this.links = 0;

    // The response document's top-level meta information.
    this.meta = 0;

    return super(initialValues);
  }
}