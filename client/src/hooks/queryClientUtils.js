const normalizeQueryFilter = queryFilter => {
  if (!queryFilter) return null;
  if (Array.isArray(queryFilter)) return { queryKey: queryFilter };
  if (typeof queryFilter === 'object' && queryFilter.queryKey) return queryFilter;
  return { queryKey: [queryFilter] };
};

export const invalidateQueryKeys = (queryClient, queryFilters = []) => {
  queryFilters.forEach(queryFilter => {
    const normalized = normalizeQueryFilter(queryFilter);
    if (!normalized) return;
    queryClient.invalidateQueries(normalized);
  });
};

export const removeQueryKeys = (queryClient, queryFilters = []) => {
  queryFilters.forEach(queryFilter => {
    const normalized = normalizeQueryFilter(queryFilter);
    if (!normalized) return;
    queryClient.removeQueries(normalized);
  });
};

