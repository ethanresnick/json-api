export function arrayUnique(array) {
  return array.filter((a, b, c) => c.indexOf(a, b+1) < 0);
}

export function arrayValuesMatch(array1, array2) {
  return array1.length === array2.length &&
    array1.sort().join() === array2.sort().join();
}

export function arrayContains(arr, value) {
  if(!Number.isNaN(value)) {
    return arr.indexOf(value) !== -1;
  }
  else {
    return arr.some(Number.isNaN) === true;
  }
}
