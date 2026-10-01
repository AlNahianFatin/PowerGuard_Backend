/*
  Warnings:

  - You are about to drop the column `assignmentId` on the `technicianreports` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "technicianreports" DROP CONSTRAINT "technicianreports_assignmentId_fkey";

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "technicianReportId" TEXT;

-- AlterTable
ALTER TABLE "technicianreports" DROP COLUMN "assignmentId";

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_technicianReportId_fkey" FOREIGN KEY ("technicianReportId") REFERENCES "technicianreports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
