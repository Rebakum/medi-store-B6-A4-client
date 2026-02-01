-- DropForeignKey
ALTER TABLE "Medicine" DROP CONSTRAINT "Medicine_sellerId_fkey";

-- DropIndex
DROP INDEX "Medicine_categoryId_idx";

-- DropIndex
DROP INDEX "Medicine_sellerId_idx";

-- DropIndex
DROP INDEX "Medicine_status_idx";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "sellerLogo" TEXT;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
