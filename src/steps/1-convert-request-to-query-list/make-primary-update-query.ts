import { ValidatedRequest, Query } from "../../types";
import { assertBodyPresent } from "./index";

export default function(request: ValidatedRequest): Promise<Query> {
  return Promise.resolve().then(() => {
    assertBodyPresent(request);
    return <Query>{};
  });
}
