require! {Q:\q templating:\url-template 'jade' \path}
class DocumentationController
  (@registry, @apiInfo, templatePath) ->
    @template = templatePath || path.resolve(__dirname, '../../../templates/documentation.jade')

    # compute template data (never changes, so better to do it on construction than per request)
    data = @apiInfo
    data.resourcesMap = {}

    # Store in the resourcesMap the info object about each type,
    # as returned by @getTypeInfo.
    for type in @registry.types! when type != "errors"
      data.resourcesMap[type] = @getTypeInfo(type)

    @templateData = data


  index: (req, res) ->
    res.send(jade.renderFile(@template, @templateData))


  # Clients can extend this if, say, the adapter can't infer
  # as much info about the models' structure as they would like.
  getTypeInfo: (type) ->
    adapter   = @registry.adapter(type)
    modelName = adapter@@getModelName(type, adapter.inflector.singular)
    model     = adapter.getModel(modelName)

    # Combine the docs in the Resource description with the 
    # standardized schema returned by the adapter in order to build 
    # the final schema for the template.
    info = @registry.info(type)
    schema = adapter@@getStandardizedSchema(model)
    for path, fieldInfo of schema
      schema.description = info.fields[path] if info?.fields?[path]?

    # Other info
    parentType = @registry.parentType(type)
    childTypes = adapter@@getChildTypes(model, adapter.inflector.plural)
    defaultIncludes = @registry.defaultIncludes(type)

    {}
      ..\name = modelName
      ..\schema = schema
      ..\defaultIncludes = defaultIncludes if defaultIncludes?
      ..\example = info.example if info?.example?
      ..\description = info.description if info?.description?
      ..\childTypes = childTypes
      ..\parentType = parentType

module.exports = DocumentationController