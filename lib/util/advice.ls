# borrowed from flight's avice lib
module.exports =
  before: (base, before) ->
    beforeFn = if (typeof before == 'function') then before else before.obj[before.fnName]
    ->
      beforeFn(...)
      return base(...);

  after: (base, after) ->
    afterFn = if (typeof after == 'function') then after else after.obj[after.fnName]
    ->
      res = (base.unbound || base)(...)
      afterFn(...)
      res