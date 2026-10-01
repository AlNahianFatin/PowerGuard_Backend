/*
  Warnings:

  - You are about to drop the column `operatorId` on the `assignments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[assigneeId,technicianId,serviceRequestId]` on the table `assignments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assigneeId` to the `assignments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_operatorId_fkey";

-- DropIndex
DROP INDEX "assignments_operatorId_technicianId_serviceRequestId_key";

-- AlterTable
ALTER TABLE "assignments" DROP COLUMN "operatorId",
ADD COLUMN     "assigneeId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "assignments_assigneeId_technicianId_serviceRequestId_key" ON "assignments"("assigneeId", "technicianId", "serviceRequestId");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
