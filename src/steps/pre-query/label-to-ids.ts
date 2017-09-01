export default function(type, labelOrId, registry, frameworkReq) {
  return Promise.resolve().then(() => {
    const adapter      = registry.dbAdapter(type);
    const model        = adapter.getModel(adapter.constructor.getModelName(type));
    const labelMappers = registry.labelMappers(type);
    const labelMapper  = labelMappers && labelMappers[labelOrId];

    // reolve with the mapped label, or, if we couldn't find a label mapper,
    // that means we were given an id, so we just resolve with that id.
    return (typeof labelMapper === "function")
      ? labelMapper(model, frameworkReq)
      : labelOrId;
  });
}



