type ContainsMode = "insensitive";

export const buildSearchOR = (
  search: unknown,
  fields: Array<string | Record<string, any>>,
  mode: ContainsMode = "insensitive"
) => {
  const s = search ? String(search).trim() : "";
  if (!s) return undefined;

  return fields.map((f) => {
    // nested relation search support
    if (typeof f === "object") return f;

    // simple field search
    return { [f]: { contains: s, mode } };
  });
};
