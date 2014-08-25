require! {Q:\q templating:\url-template 'jade' \path}
class DocumentationController
  (@registry, @apiInfo, templatePath) ->
    @template = templatePath || path.resolve(__dirname, '../../../templates/documentation.jade')

  index: (req, res) ->
    _getModelInfo = (type) ~>
      adapter = @registry.adapter(type)
      modelName = adapter.constructor.getModelName(type)
      inflector = adapter.inflector

      return
        name: modelName
        schema: adapter.constructor.getStandardizedSchema(adapter.getModel(modelName)) 

    data = @apiInfo
    data.resourcesMap = {}
    for type in @registry.types!
      data.resourcesMap[type] = _getModelInfo(type)

    res.send(jade.renderFile(@template, data))

module.exports = DocumentationController