import { ValidatedRequest, Query } from "../../types";
import { assertBodyPresent } from "./index";

export default function(request: ValidatedRequest): Promise<Query> {
  return Promise.resolve().then(() => {
    // if we're deleting from a relationship, we must have a body.
    request.frameworkParams.relationship && assertBodyPresent(request);
    return <Query>{};
  });
}
