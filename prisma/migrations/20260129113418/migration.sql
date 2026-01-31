/*
  Warnings:

  - A unique constraint covering the columns `[userId,medicineId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Medicine_sellerId_idx" ON "Medicine"("sellerId");

-- CreateIndex
CREATE INDEX "Medicine_categoryId_idx" ON "Medicine"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_medicineId_key" ON "Review"("userId", "medicineId");
