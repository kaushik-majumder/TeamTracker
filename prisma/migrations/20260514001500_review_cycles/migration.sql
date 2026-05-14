-- Add new value to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE 'REVIEW_ASSIGNED';

-- New enums
CREATE TYPE "CycleStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');
CREATE TYPE "ReviewStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- ReviewCycle
CREATE TABLE "ReviewCycle" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" "CycleStatus" NOT NULL DEFAULT 'DRAFT',
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReviewCycle_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ReviewCycle" ADD CONSTRAINT "ReviewCycle_createdBy_fkey"
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ReviewCycleTeam (scope link)
CREATE TABLE "ReviewCycleTeam" (
  "id" TEXT NOT NULL,
  "cycleId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  CONSTRAINT "ReviewCycleTeam_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReviewCycleTeam_cycleId_teamId_key" ON "ReviewCycleTeam"("cycleId", "teamId");

ALTER TABLE "ReviewCycleTeam" ADD CONSTRAINT "ReviewCycleTeam_cycleId_fkey"
  FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewCycleTeam" ADD CONSTRAINT "ReviewCycleTeam_teamId_fkey"
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CycleReview
CREATE TABLE "CycleReview" (
  "id" TEXT NOT NULL,
  "cycleId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "reviewerId" TEXT,
  "rating" INTEGER,
  "strengths" TEXT,
  "improvements" TEXT,
  "goals" TEXT,
  "status" "ReviewStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CycleReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CycleReview_cycleId_employeeId_key" ON "CycleReview"("cycleId", "employeeId");
CREATE INDEX "CycleReview_reviewerId_status_idx" ON "CycleReview"("reviewerId", "status");

ALTER TABLE "CycleReview" ADD CONSTRAINT "CycleReview_cycleId_fkey"
  FOREIGN KEY ("cycleId") REFERENCES "ReviewCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CycleReview" ADD CONSTRAINT "CycleReview_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CycleReview" ADD CONSTRAINT "CycleReview_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
