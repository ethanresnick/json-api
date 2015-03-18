import ResponseContext from "./types/Context/ResponseContext"
export default function(registry) {
  let supportedExt = ["bulk"];

  return function(requestContext) {
    let responseContext = new ResponseContext();
}
