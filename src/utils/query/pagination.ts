export const getPagination = (query: any, maxLimit = 50) => {
  const page = Math.max(parseInt(String(query.page ?? "1"), 10) || 1, 1);
  const limitRaw = parseInt(String(query.limit ?? "10"), 10) || 10;
  const limit = Math.min(Math.max(limitRaw, 1), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const buildMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPage: Math.ceil(total / limit),
});
