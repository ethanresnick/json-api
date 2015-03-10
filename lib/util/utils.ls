require! [\../types/Collection]
module.exports =
  # takes an arbitrary path string e.g. "user.contact.phone" 
  # and locates the corresponding property on an object (obj)
  # and deletes it (ie. does delete obj.user.contact.phone).
  # Doesn't use eval though, which makes it safer.
  deleteNested: (path, object) ->
    try
      pathParts = path.split('.')
      lastPart  = pathParts[*-1]
      containingParts = pathParts.slice(0, pathParts.length-1);
      container = containingParts.reduce(((obj, part) -> obj[part]), object)
      delete container[lastPart]
    catch error
      console.log("deleteNested failed with path: " + path + ", on oject: " + JSON.stringify(object))

  # it's a REALLY common pattern that we want to apply some 
  # function either to a resource or all the resources in a
  # collection. This function abstracts that.
  mapResources: (resourceOrCollection, mapFn) ->
    if resourceOrCollection instanceof Collection
      resourceOrCollection.resources.map(mapFn)
    else 
      mapFn(resourceOrCollection)

  mapArrayOrVal: (arrayOrVal, mapFn) ->
    if arrayOrVal instanceof Array
      arrayOrVal.map(mapFn)
    else
      mapFn(arrayOrVal)

  forEachArrayOrVal: (arrayOrVal, eachFn) ->
    if arrayOrVal instanceof Array
      arrayOrVal.forEach(eachFn)
    else
      eachFn(arrayOrVal)

  arrayValuesMatch: (array1, array2) ->
    array1.length == array2.length && array1.sort!.join! == array2.sort!.join!

  arrayUnique: (array) ->
    console.log(array)
    array.filter((a, b, c) -> c.indexOf(a,b+1) < 0)