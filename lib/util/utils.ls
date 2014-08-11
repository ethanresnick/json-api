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
      console.log(error)
      console.log("deleteNested failed with path: " + path + ", on oject: " + JSON.stringify(object))
