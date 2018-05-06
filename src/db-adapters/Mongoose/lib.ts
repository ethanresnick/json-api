// This file contains utility functions used by the Mongoose adapter that
// aren't part of the class's public interface. Don't use them in your own
// code, as their APIs are subject to change.
import APIError from "../../types/APIError";
import Resource from "../../types/Resource";
import * as Errors from "../../util/errors";
import { FieldExpression, Identifier } from "../../types/index";

// tslint:disable-next-line no-var-requires no-submodule-imports
const MongooseError = require("mongoose/lib/error");

/**
 * Takes any error that resulted from the above operations throws an array of
 * errors that can be sent back to the caller as the Promise's rejection value.
 */
export function errorHandler(err, context?: { type: string, id?: string }): never {
  const errors: (APIError | Error)[] = [];

  // Convert validation errors collection to something reasonable
  if(err.errors) {
    Object.keys(err.errors).forEach(errKey => {
      const thisError = err.errors[errKey];
      const metaSource = { source: { field: thisError.path, ...context } };

      const errorFormatted = (() => {
        if(err.name === 'ValidationError') {
          // Handle required violations separately, with a different error type.
          if(thisError.kind === 'required') {
            return Errors.missingField({
              detail: thisError.message,
              rawError: thisError,
              meta: { ...metaSource }
            });
          }

          // If the ValidationError was caused by an error explicitly marked as
          // display safe (e.g., as thrown by the user in a setter), use that.
          // See https://github.com/Automattic/mongoose/issues/3320 (but note
          // that reason can be on more than just CastError's)
          if(APIError.isDisplaySafe(thisError.reason)) {
            const apiError = APIError.fromError(thisError.reason);
            apiError.meta = { ...apiError.meta, ...metaSource };
            return apiError;
          }

          // If the validation error was caused by an error thrown by a user
          // in a custom setter or validation function (which we try to identify
          // by checking if the error is not a MongooseError), but that isn't
          // displaySafe, use a generic message but at least set rawError properly.
          else if(thisError.reason && !(thisError.reason instanceof MongooseError)) {
            return Errors.invalidFieldValue({
              detail: `Invalid value for path "${thisError.path}"`,
              rawError: thisError.reason,
              meta: { ...metaSource }
            })
          }

          return Errors.invalidFieldValue({
            detail: thisError.message,
            rawError: thisError,
            meta: { ...metaSource }
          });
        }

        return APIError.fromError(thisError);
      })();

      errors.push(errorFormatted);
    });
  }

  // Mongo unique constraint error.
  else if(err.name === 'MongoError' && err.code === 11000) {
    errors.push(
      Errors.uniqueViolation(<any>{
        rawError: err,
        // add the below as an attempt at backwards compatibility for users
        // switching on code in query.catch(). Code is not serialized.
        // This is the only place in the codebase we use code, which is
        // normally not allowed, hence the `any` assertion above.
        code: 11000
      })
    );
  }

  // Send the raw error.
  // Don't worry about revealing internal concerns, as the pipeline maps
  // all unhandled errors to generic json-api APIError objects pre responding.
  else {
    errors.push(err);
  }

  throw errors;
}

export function toMongoCriteria(constraint: FieldExpression) {
  const mongoOperator =
    "$" + (constraint.operator === 'neq' ? 'ne' : constraint.operator);

  if(constraint.operator === "and" || constraint.operator === "or") {
    // Below, we do a length check because mongo doesn't support and/or/nor
    // predicates with no constraints to check (makes sense). For $and,
    // if we wanted to use comma separated values for implicit AND we could:
    // Object.assign({}, ...constraintOrPredicate.args.map(handle))
    // Instead, though, we use the same rules as $or, because the implicit
    // AND doesn't work in all cases;
    // see https://docs.mongodb.com/manual/reference/operator/query/and/
    return !constraint.args.length
      ? {}
      : {
          [mongoOperator]:
            (constraint.args as FieldExpression[]).map(toMongoCriteria)
        };
  }

  // The check below won't match if a geoWithin contains the toGeoCircle,
  // because we don't recurse down when we encounter a geoWithin.
  if(constraint.operator === "toGeoCircle") {
    throw new APIError({
      status: 400,
      title: "Can only have toGeoCircle inside of a geoWithin."
    });
  }

  // Note: all the operators we support (as declared in the adapter) are either:
  // 1) the ones handled above (`and` + `or`); or 2) binary ones with a field
  // reference on the left-hand side. For the latter, this requirement has already
  // been validated such that, below, we know that args[0] holds an identifier.
  const fieldName = (constraint.args[0] as Identifier).value;
  const mongoField = <string>(fieldName === 'id' ? '_id' : fieldName);
  const value = constraint.args[1];

  if(constraint.operator === "geoWithin") {
    // For geoWithin, find the toGeoCircle and convert it to a centerSphere exp.
    // We should always have a toGeoCircle as args[1], but let's be super careful.
    // This'll prevent us from forgetting to modify this function if we expand
    // the supported values for geoWithin, among other potential bugs.
    if(!(value && value.operator === 'toGeoCircle')) {
      throw new Error("Expected toGeoCircle for second argument.");
    }

    const finalValue = {
      $centerSphere: [value.args[0], value.args[1] / 6378100]
    };

    return {
      [mongoField]: {
        [mongoOperator]: finalValue
      }
    };
  }

  if(constraint.operator === 'eq') {
    return { [mongoField]: value }
  }

  return {
    [mongoField]: {
      [mongoOperator]: value
    }
  };
}

/**
 * Takes a Resource object and returns JSON that could be passed to Mongoose
 * to create a document for that resource. The returned JSON doesn't include
 * the id (as the input resources are coming from a client, and we're
 * ignoring client-provided ids) or the type (as that is set by mongoose
 * outside of the document) or the meta (as storing that like a field may not
 * be what we want to do).
 */
export function resourceToDocObject(resource: Resource, typePathFn?): object {
  const res = {
    ...resource.attrs,
    ...(typePathFn ? typePathFn(resource.typePath) : {})
  };

  Object.keys(resource.relationships).forEach(key => {
    res[key] = resource.relationships[key].unwrapDataWith(it => it.id);
  });

  return res;
}
