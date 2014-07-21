require! {
  template: \url-template, 
  './ResourceAdapter'
}

class ResourceType
  (@name, @urlTemplates) ~>
    for k, v of @urlTemplates
      @urlTemplates[k] = template.parse(v)

module.exports = ResourceType