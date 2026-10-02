/*
  Warnings:

  - You are about to drop the column `technicianReportId` on the `assignments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[assignmentId]` on the table `technicianreports` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_technicianReportId_fkey";

-- AlterTable
ALTER TABLE "assignments" DROP COLUMN "technicianReportId";

-- AlterTable
ALTER TABLE "technicianreports" ADD COLUMN     "assignmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "technicianreports_assignmentId_key" ON "technicianreports"("assignmentId");

-- AddForeignKey
ALTER TABLE "technicianreports" ADD CONSTRAINT "technicianreports_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
