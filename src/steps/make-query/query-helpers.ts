/*
Note: adding overloads here creates more (false) compile errors than it fixes,
because of issues like https://github.com/Microsoft/TypeScript/issues/10523
static getIdQueryType(ids: string[]): ["find", {_id: {$in: string[]}}];
static getIdQueryType(id: string): ["findOne", {_id: string}];
static getIdQueryType(id: undefined): ["find", {}];
static getIdQueryType(): ["find", {}];*/
export function getIdQueryType(idOrIds: string | string[] | undefined = undefined) {
  type result =
    [{ id: string }, true] | // one resource
    [{ id: { in: string[] } }, false] | // set of resources
    [undefined, false]; // all resources in collection

  return <result>(() => {
    if(Array.isArray(idOrIds)) {
      return [{ id: { in: idOrIds } }, false];
    }

    else if(typeof idOrIds === "string") {
      return [{ id: idOrIds }, true];
    }

    else {
      return [undefined, false];
    }
  })();
}
