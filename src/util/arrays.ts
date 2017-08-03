export function arrayUnique(array: any[]) {
  return Array.from(new Set(array).values());
}

export function arrayValuesMatch(array1, array2) {
  return array1.length === array2.length &&
    array1.sort().join() === array2.sort().join();
}

export function arrayContains(arr: any[], value: any) {
  return arr.includes(value);
}
