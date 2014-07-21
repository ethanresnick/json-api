require! \mongoose;

class MongooseQueryBuilder
  (@model, @options) ->
    # find the names of all the paths in the
    # schema that refer to other models
    @refPaths = [];
    @model.schema.eachPath((name, type) -> 
      @refPaths.push(name) if type.options.ref?
    );

    @queryBuilder = new mongoose.Query(null, null, @model, @model.collection)

  withIds: (ids) ->
    @queryBuilder.in('id', if typeof! ids is \Array then ids else [ids])

  withProperty: (prop, val) ->
    @queryBuilder.where({prop: val})

  onlyFields: (fields) ->
    # assumes that, in your shchema, you haven't 
    # forced any fields to appear. reasonable.
    @queryBuilder.select(fields.join(' '))
  
  includeLinked: (paths) ->
    # a path might point to a property that's not in this
    # model's schema. E.g. on a BlogPost resource, the
    # path could be comments.author, but the BlogPost
    # will only know about the `comments` part of the path.
    @refPaths.forEach(-> 
      for path, i in paths when (path.substr(0, it.length) == it)
        pathExtra = path.substr(it.length + 1) # remove next dot
        @queryBuilder.populate(({}
          ..path = it
          ..select = pathExtra if(pathExtra)
        ))
        # removed matched path so we don't check it next time.
        paths.splice(i, 1);
        continue
    )

    # if there were errors, in the form of unmatcheable paths...
    # try to populate those paths anyway, so mongoose will throw
    # an error when the query is actually executed
    if(paths.length)
      paths.forEach(-> @queryBuilder.populate(path: it))

    /**
     * @param sorts array An array of field names to sort on.
     * Ascending is the default sort; prefix the field name with
     * a - to sort descending.
     */
    sort: (sorts) ->
      @queryBuilder.sort(sorts.join(' '))


class MongooseAdapter
  (@model, @before, @a) ~>
    @qb = new MongooseQueryBuilder(@model)

  query: -> @qb

module.exports = MongooseAdapter