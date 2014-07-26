require! [\./Resource \./Collection]

class Document
  (@resources, @meta)->

  renderResource: (resource) ->
    res = resource.attrs
    res.id = resource.id if resource.id
    res

  get: ->
    (@resources.type): (
      if @resources instanceof Collection
      then @resources.resources.map(@~renderResource)
      else @renderResource(@resources)
    )

module.exports = Document