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
    # resources POV (as specifying the type in paths is redundant), it would
    # require us to write logic converting the paths in template variables to
    # global paths, and that could be tricky.
    @_resourceTypes = {}

  type: (type, description) ->
    if description
      # the valid properties to register.
      @_resourceTypes[type] = {}
      ["adapter", "beforeSave", "afterQuery", "urlTemplates", "defaultIncludes"].forEach(~>
        @[it](type, description[it]) if description[it]?
      )
    else
      {} <<< @_resourceTypes[type] if @_resourceTypes[type]? 

  adapter: (type, adapter) ->
    if adapter
      @_resourceTypes.{}[type]['adapter'] = adapter
    else
      @_resourceTypes.{}[type]['adapter']

  beforeSave: (type, beforeFn) ->
    if beforeFn
      @_resourceTypes.{}[type]['beforeSave'] = beforeFn
    else
      @_resourceTypes.{}[type]['beforeSave']

  afterQuery: (type, afterFn) ->
    if afterFn
      @_resourceTypes.{}[type]['afterQuery'] = afterFn
    else
      @_resourceTypes.{}[type]['afterQuery']

  urlTemplates: (type, templates) ->
    switch arguments.length
    | 2 =>
      for path, template of templates
        throw new Error("Template paths must be scoped to this type") if path.split('.')[0] !== type
      @_resourceTypes.{}[type]['urlTemplates'] = templates
    | 1 =>
      @_resourceTypes.{}[type]['urlTemplates']
    | otherwise =>
      templates = {}
      for type, resource of @_resourceTypes
        templates <<< (resource.urlTemplates || {})
      templates

  defaultIncludes: (type, defaults) ->
    if defaults
      @_resourceTypes.{}[type]['defaultIncludes'] = defaults
    else
      @_resourceTypes.{}[type]['defaultIncludes']

  urlTemplate: (path) ->
    @_resourceTypes[path.split('.').0]['urlTemplates'][path]

  # returns a list of registered types.
  types: ->
    Object.keys(@_resourceTypes)

module.exports = ResourceTypeRegistry