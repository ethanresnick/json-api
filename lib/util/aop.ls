# adapted from flight's advice lib
# note: the before/after/around function's aren't bound, so
# make sure you bind their `this` properly before passing them in.
module.exports =
  before: (base, beforeFn) ->
    ->
      beforeFn(...)
      return base(...)

  after: (base, afterFn) ->
    ->
      res = base(...)
      afterFn(...)
      res

  around: (base, wrapped) ->
    ->
      l = arguments.length
      args = new Array(l + 1)
      args[0] = base
      for i from 0 til l
        args[i + 1] = arguments[i]
     
      wrapped(args)