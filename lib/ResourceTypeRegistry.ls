require! {Q:\q 'mongoose', './types/Document'}

/**
 * To fulfill a JSON API request, you often need to know about all the 
 * resources in the system--not just the primary resource associated with
 * the type being requested. For example, if the request is for a User, 
 * you might need to include related Projects, so the code handling the users
 * request needs access to the Project resource's beforeSave and afterQuery 
 * methods. Similarly, it would need access to url templates that point at 
 * relationships on the Project resources, to return those templates with the
 * included Projects. Etc. So we handle this by introducing a ResourceTypeRegistry 
 * that the BaseController can have access to. Each resource type is registered
 * by its name (the JSON api type value) and has four properties: adapter, 
 * urlTemplates, and the beforeSave and afterQuery methods.
 */
class ResourceTypeRegistry
  ->
    # Note: although urlTemplates are registered as part of a resource, the
    # paths they're registered with and the names of template variables should 
    # be global for now. I.e. the users resource type registers a template as:
    # "users.profile": "http://example.com/api/profiles/{users.profile}".
    # It does NOT do: "profile": "http://example.com/api/profiles/{profile}".
    # This is because, even though the latter makes more sense from the
    # resource's POV (as specifying the type in paths is redundant), it would
    # require us to write logic converting the paths in template variables to
    # global paths, and that could be tricky.

    # Initialize the registry with the errors type, which the spec defines.
    @_resourceTypes = {"errors": {}}

  type: (type, description) ->
    if description
      # the valid properties to register.
      @_resourceTypes[type] = {}
      ["adapter", "beforeSave", "afterQuery", "labelToIdOrIds", "urlTemplates", 
       "defaultIncludes", "info"].forEach(~>
        @[it](type, description[it]) if description[it]?
      )
    else
      {} <<< @_resourceTypes[type] if @_resourceTypes[type]? 

  adapter: makeGetterSetter('adapter')
  beforeSave: makeGetterSetter('beforeSave')
  afterQuery: makeGetterSetter('afterQuery')
  labelToIdOrIds: makeGetterSetter('labelToIdOrIds')
  defaultIncludes: makeGetterSetter('defaultIncludes')
  info: makeGetterSetter('info')

  urlTemplates: (type, templates) ->
    switch arguments.length
    | 1 =>
      @_resourceTypes.{}[type]['urlTemplates']

    | 0 =>
      templates = {}
      for type, resource of @_resourceTypes
        templates <<< (resource.urlTemplates || {})
      templates

    | otherwise =>
      for path, template of templates
        if path.split('.')[0] !== type
          throw new Error("Template paths must be scoped to this type")
      @_resourceTypes.{}[type]['urlTemplates'] = templates

  urlTemplate: (path) ->
    @_resourceTypes[path.split('.').0]['urlTemplates'][path]

  # returns a list of registered types.
  types: ->
    Object.keys(@_resourceTypes)

module.exports = ResourceTypeRegistry

function makeGetterSetter(attrName)
  (type, optValue) ->
    if typeof @_resourceTypes[type] !== "object"
      throw new Error("Type " + type + ' has not been registered.')

    if optValue
      @_resourceTypes[type][attrName] = optValue

    else
      @_resourceTypes[type][attrName]