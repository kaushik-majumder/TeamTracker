-- Make recommendedBy nullable on PromotionRequest
ALTER TABLE "PromotionRequest" ALTER COLUMN "recommendedBy" DROP NOT NULL;
-- Drop and recreate FKs with ON DELETE SET NULL
ALTER TABLE "PromotionRequest" DROP CONSTRAINT IF EXISTS "PromotionRequest_recommendedBy_fkey";
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_recommendedBy_fkey"
  FOREIGN KEY ("recommendedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PromotionRequest" DROP CONSTRAINT IF EXISTS "PromotionRequest_reviewedBy_fkey";
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_reviewedBy_fkey"
  FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Same for SalaryHikeRequest
ALTER TABLE "SalaryHikeRequest" ALTER COLUMN "recommendedBy" DROP NOT NULL;
ALTER TABLE "SalaryHikeRequest" DROP CONSTRAINT IF EXISTS "SalaryHikeRequest_recommendedBy_fkey";
ALTER TABLE "SalaryHikeRequest" ADD CONSTRAINT "SalaryHikeRequest_recommendedBy_fkey"
  FOREIGN KEY ("recommendedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalaryHikeRequest" DROP CONSTRAINT IF EXISTS "SalaryHikeRequest_reviewedBy_fkey";
ALTER TABLE "SalaryHikeRequest" ADD CONSTRAINT "SalaryHikeRequest_reviewedBy_fkey"
  FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Performance record author
ALTER TABLE "PerformanceRecord" ALTER COLUMN "createdBy" DROP NOT NULL;
ALTER TABLE "PerformanceRecord" DROP CONSTRAINT IF EXISTS "PerformanceRecord_createdBy_fkey";
ALTER TABLE "PerformanceRecord" ADD CONSTRAINT "PerformanceRecord_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
