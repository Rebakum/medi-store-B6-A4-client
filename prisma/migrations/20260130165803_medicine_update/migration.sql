/*
  Warnings:

  - Added the required column `brand` to the `Medicine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `form` to the `Medicine` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MedicineForm" AS ENUM ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'DROPS');

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "brand" TEXT NOT NULL,
ADD COLUMN     "form" "MedicineForm" NOT NULL;
