// This file contains utility functions used by the Mongoose adapter that
// aren't part of the class's public interface. Don't use them in your own
// code, as their APIs are subject to change.
import APIError from "../../types/APIError";
import { FieldConstraint, Predicate } from "../../types/index";

/**
 * Takes any error that resulted from the above operations throws an array of
 * errors that can be sent back to the caller as the Promise's rejection value.
 */
export function errorHandler(err) {
  const errors: APIError[] = [];
  //Convert validation errors collection to something reasonable
  if(err.errors) {
    for(const errKey in err.errors) {
      const thisError = err.errors[errKey];
      errors.push(
        new APIError(
          (err.name === "ValidationError") ? 400 : (thisError.status || 500),
          undefined,
          thisError.message,
          undefined,
          undefined,
          (thisError.path) ? [thisError.path] : undefined
        )
      );
    }
  }

  // Send the raw error.
  // Don't worry about revealing internal concerns, as the pipeline maps
  // all unhandled errors to generic json-api APIError objects pre responding.
  else {
    errors.push(err);
  }

  throw errors;
}

export function getReferencePaths(model) {
  const paths: string[] = [];
  model.schema.eachPath((name, type) => {
    if(isReferencePath(type)) paths.push(name);
  });
  return paths;
}

export function isReferencePath(schemaType) {
  const options = (schemaType.caster || schemaType).options;
  return options && options.ref !== undefined;
}

export function getReferencedModelName(model, path) {
  const schemaType = model.schema.path(path);
  const schemaOptions = (schemaType.caster || schemaType).options;
  return schemaOptions && schemaOptions.ref;
}

export function toMongoCriteria(constraintOrPredicate: FieldConstraint | Predicate) {
  const mongoOperator = "$" +
    (constraintOrPredicate.operator === 'neq' // mongo calls neq $ne instead
      ? 'ne'
      : constraintOrPredicate.operator);

  switch(constraintOrPredicate.operator) {
    case "and":
    case "or":
      // Below, we do a length check because mongo doesn't support and/or/nor
      // predicates with no constraints to check (makes sense). For $and,
      // if we wanted to use comma separated values for implicit AND we could:
      // Object.assign({}, ...constraintOrPredicate.value.map(handle))
      // Instead, though, we use the same rules as $or, because the implicit
      // AND doesn't work in all cases; see https://docs.mongodb.com/manual/reference/operator/query/and/
      return !constraintOrPredicate.value.length
        ? {}
        : {
            [mongoOperator]: constraintOrPredicate.value.map(toMongoCriteria)
          };

    case "eq":
      return { [constraintOrPredicate.field]: constraintOrPredicate.value };

    default:
      return {
        [constraintOrPredicate.field]: {
          [mongoOperator]: constraintOrPredicate.value
        }
      }
  }
}

/**
 * Takes a Resource object and returns JSON that could be passed to Mongoose
 * to create a document for that resource. The returned JSON doesn't include
 * the id (as the input resources are coming from a client, and we're
 * ignoring client-provided ids) or the type (as that is set by mongoose
 * outside of the document) or the meta (as storing that like a field may not
 * be what we want to do).
 */
export function resourceToDocObject(resource): object {
  const res = {...resource.attrs};
  const getId = (it) => it.id;
  for(const key in resource.relationships) {
    const linkage = resource.relationships[key].linkage.value;

    // handle linkage when set explicitly for empty relationships
    if(linkage === null || (Array.isArray(linkage) && linkage.length === 0)) {
      res[key] = linkage;
    }

    else {
      res[key] = Array.isArray(linkage) ? linkage.map(getId) : linkage.id;
    }
  }
  return res;
}
