import Q from "q"
import APIError from "../../types/APIError"
import Negotiator from "negotiator"
import parseAccept from "../../../lib/accept-parser"
import {arrayValuesMatch} from "../../util/utils"

export default function(acceptHeader, usedExt, supportedExt) {
  return Q.Promise(function(resolve, reject) {
    let accepts = parseAccept(acceptHeader || "*/*");
    let negotiator = new Negotiator({headers: {accept: acceptHeader}});

    // Find all the Accept clauses that specifically reference json api.
    let jsonAPIAcceptsExts = accepts.filter((it) => {
      return it.type === "application" && it.subtype === "vnd.api+json";
    }).map((it) =>
      // and map them to they extensions they ask for, trimming the quotes off
      // of each extension, because the parser's too stupid to do that.
      it.params.ext ?
      it.params.ext.split(",").map((it2) => it2.replace(/^\"+|\"+$/g, "")) :
      []
    );
    // If we have an Accept clause that asks for JSON-API
    // with exactly the extensions we're using, then we're golden.
    if(jsonAPIAcceptsExts.some((it) => arrayValuesMatch(it, usedExt))) {
      let usedExtString = usedExt.length ? `; ext="${usedExt.join(",")}"` : "";
      let supportedExtString = `supported-ext="${supportedExt.join(",")}"`;
      resolve(`application/vnd.api+json; ${supportedExtString}${usedExtString}`);
    }

    // Otherwise, if they'll accept json, we're ok.
    else if(negotiator.mediaType(["application/json"])) {
      resolve("application/json");
    }

    // They don't accept json api with our particular extensions,
    // or json in general, so we have to 406.
    else {
      reject(new APIError(406, null, "Not Acceptable"));
    }
  });
}
