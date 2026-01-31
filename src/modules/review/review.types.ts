export type CreateReviewPayload = {
  medicineId: string;
  rating: number;
  comment?: string | undefined;
};

export type UpdateReviewPayload = {
  rating?: number | undefined;
  comment?: string | undefined;
};

export type Role = "CUSTOMER" | "SELLER" | "ADMIN";
