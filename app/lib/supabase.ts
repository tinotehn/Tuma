const makeQuery = (initialData: any = []) => {
  const query: any = {
    select: () => query,
    eq: () => query,
    single: async () => ({ data: initialData, error: null }),
    insert: () => query,
    update: () => query,
    limit: async () => ({ data: Array.isArray(initialData) ? initialData : [], error: null }),
    order: () => query,
  };

  return query;
};

export const supabase = {
  from: () => makeQuery([]),
};
