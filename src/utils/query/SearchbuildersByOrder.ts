/** -----------------------------------------
 *  Search where builders
 *  ----------------------------------------- */

export const buildOrderSearchWhere = (search: any) => {
  const s = String(search ?? "").trim();
  if (!s) return undefined;

  // Order model fields + customer relation
  return {
    OR: [
      { id: { contains: s, mode: "insensitive" } },
      { address: { contains: s, mode: "insensitive" } },
      { phone: { contains: s, mode: "insensitive" } },
      { customer: { name: { contains: s, mode: "insensitive" } } },
      { customer: { email: { contains: s, mode: "insensitive" } } },
    ],
  } as any;
};

export const buildSellerSearchWhere = (search: any) => {
  const s = String(search ?? "").trim();
  if (!s) return undefined;

  // OrderItem based list: search on medicine + order + customer
  return {
    OR: [
      { orderId: { contains: s, mode: "insensitive" } },
      { medicine: { name: { contains: s, mode: "insensitive" } } },
      { order: { address: { contains: s, mode: "insensitive" } } },
      { order: { phone: { contains: s, mode: "insensitive" } } },
      { order: { customer: { name: { contains: s, mode: "insensitive" } } } },
      { order: { customer: { email: { contains: s, mode: "insensitive" } } } },
    ],
  } as any;
};