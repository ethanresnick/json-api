export default function(request, response, registry, query) {
  const type    = request.type;
  const adapter = registry.dbAdapter(type);

  return adapter.doQuery(query).then((resources) => {
    response.primary = (request.relationship)
      ? resources.relationships[request.relationship].linkage
      : resources;
  });
}
