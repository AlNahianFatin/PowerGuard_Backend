/*
  Warnings:

  - The `status` column on the `outagereports` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OutageReportStatus" AS ENUM ('PENDING', 'VERIFIED', 'ASSIGNED', 'INPROGRESS', 'RESOLVED', 'FAILED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "outagereports" DROP COLUMN "status",
ADD COLUMN     "status" "OutageReportStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "OutageStatus";

-- CreateIndex
CREATE INDEX "outagereports_status_idx" ON "outagereports"("status");
