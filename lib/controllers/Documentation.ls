require! {Q:\q templating:\url-template 'jade' \path}
class DocumentationController
  (@registry, @apiInfo, templatePath) ->
    @template = templatePath || path.resolve(__dirname, '../../../templates/documentation.jade')

    # compute template data (never changes, so better to do it on construction than per request)
    data = @apiInfo
    data.resourcesMap = {}
    childTypesToParentTypesMap = {}
    for type in @registry.types!
      adapter   = @registry.adapter(type)
      inflector = adapter.inflector
      modelName = adapter@@getModelName(type, inflector.singular)
      model     = adapter.getModel(modelName)
      children  = adapter@@getChildTypes(model, inflector.plural)

      data.resourcesMap[type] = @getModelInfo(type, adapter, modelName, model)

      # store model relationships as we come across them.
      if children
        for childType in children
          childTypesToParentTypesMap[childType] = type

    # attach parent models to data
    for type, info of data.resourcesMap
      info.parentType = childTypesToParentTypesMap[type]

    @templateData = data


  index: (req, res) ->
    res.send(jade.renderFile(@template, @templateData))


  # Clients can extend this if, say, the adapter can't infer
  # as much info about the models' structure as they would like.
  getModelInfo: (type, adapter, modelName, model) ->
    info      = @registry.info(type)
    fieldsInfo = adapter@@getStandardizedSchema(model)

    for path, fieldInfo of fieldsInfo
      fieldInfo.description = info.fields[path] if info?.fields?[path]?

    {}
      ..\name = modelName
      ..\example = info.example if info?.example?
      ..\defaultIncludes = info.defaultIncludes if info?.defaultIncludes?
      ..\description = info.description if info?.description?
      ..\schema = fieldsInfo

module.exports = DocumentationController