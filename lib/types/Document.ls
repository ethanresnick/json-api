require! [\./Resource \./Collection]

class Document
  (@resources, @meta)->

  renderResource: (resource) ->
    res = resource.attrs
    res.id = resource.id if resource.id
    res

  get: ->
    doc = {}
    doc[@resources.type] = (
      if @resources instanceof Collection
      then @resources.resources.map(@~renderResource)
      else @renderResource(@resources)
    )

    if @meta then doc.meta = @meta
    doc

    # todo: support linked and links

module.exports = Document