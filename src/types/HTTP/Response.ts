import {ValueObject} from "../../util/type-handling";
import { PrimaryData } from "../../types/index";
import Collection from "../../types/Collection";
import APIError from "../../types/APIError";

const propDesc = {writable: true, enumerable: true};

export class Response {
  public ext: string[];
  public errors: APIError[];
  public contentType: string | null;
  public headers: {[headerName: string]: string};
  public status: number | null;
  public body: string | null;
  public primary: undefined | PrimaryData;
  public included: undefined | Collection;
  public meta: object | undefined;

  constructor() {
    // The JSON-API extensions used to formulate the response,
    // which affects the final the Content-Type header and our
    // validation of the client's `Accept` header.
    this.ext = [];

    // The response's errors. If it has some,
    // we render them instead of a standard document.
    this.errors = [];

    // The response's content type.
    this.contentType = null;

    // Other headers in the response.
    this.headers = { /* vary and location typically */ };

    // The response's status.
    this.status = null;

    // The JSON for the response body, as a string.
    // Down the line, this might allow for a stream.
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

export default ValueObject(Response);
