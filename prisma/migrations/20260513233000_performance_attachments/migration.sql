CREATE TABLE "PerformanceAttachment" (
  "id" TEXT NOT NULL,
  "performanceRecordId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "dataUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PerformanceAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PerformanceAttachment_performanceRecordId_idx" ON "PerformanceAttachment"("performanceRecordId");

ALTER TABLE "PerformanceAttachment" ADD CONSTRAINT "PerformanceAttachment_performanceRecordId_fkey"
  FOREIGN KEY ("performanceRecordId") REFERENCES "PerformanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
