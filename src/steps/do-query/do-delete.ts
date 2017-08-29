export default function(request, response, registry, query) {
  const type    = request.type;
  const adapter = registry.dbAdapter(type);

  return adapter[query.method](query).then(() => {
    response.status = 204;
  });
}
