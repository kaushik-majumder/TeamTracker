-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'LEFT');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "leftDate" TIMESTAMP(3),
ADD COLUMN     "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE';
