-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MANAGING_DIRECTOR';

-- AlterTable
ALTER TABLE "PromotionRequest" ADD COLUMN     "subjectUserId" TEXT,
ALTER COLUMN "employeeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SalaryHikeRequest" ADD COLUMN     "subjectUserId" TEXT,
ALTER COLUMN "employeeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryHikeRequest" ADD CONSTRAINT "SalaryHikeRequest_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
