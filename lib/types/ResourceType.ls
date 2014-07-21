require! {
  template: \url-template
}

class ResourceType
  (@name, @urlTemplates) ~>
    for k, v of @urlTemplates
      @urlTemplates[k] = template.parse(v)

module.exports = ResourceType