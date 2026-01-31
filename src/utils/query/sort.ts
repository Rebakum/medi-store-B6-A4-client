export const buildSort = <T extends string>(
  query: any,
  allowed: readonly T[],
  defaultSort?: T
) => {
  if (allowed.length === 0) {
    throw new Error("allowed sort fields cannot be empty");
  }

  const fallback = defaultSort ?? allowed[0]!;
  const sortBy = String(query.sortBy ?? fallback) as T;
  const sortOrder = String(query.sortOrder) === "asc" ? "asc" : "desc";

  const finalSortBy = allowed.includes(sortBy) ? sortBy : fallback;

  return { orderBy: { [finalSortBy]: sortOrder } as Record<T, "asc" | "desc"> };
};
