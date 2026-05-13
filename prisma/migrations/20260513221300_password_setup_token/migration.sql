-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

ALTER TABLE "User" ADD COLUMN "passwordSetupToken" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordSetupExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_passwordSetupToken_key" ON "User"("passwordSetupToken");
