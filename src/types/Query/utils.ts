export function assertKeysTruthy(keys, obj) {
  if(!keys.every(it => obj[it])) {
    throw new Error(
      `One of these required keys is missing: ${keys.join(", ")}.`
    );
  }
}
