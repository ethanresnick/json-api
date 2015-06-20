import dasherize from "dasherize";

export function dasherizeResource(resource) {
  for (let key in resource.attrs) {
    let dasherizedKey = dasherize(key);
    if (dasherizedKey !== key) {
      resource.attrs[dasherizedKey] = resource.attrs[key];
      delete resource.attrs[key];
    }
  }

  return resource;
}
