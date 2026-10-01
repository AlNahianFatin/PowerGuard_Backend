/*
  Warnings:

  - You are about to drop the column `operatorId` on the `schedules` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `schedules` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_operatorId_fkey";

-- AlterTable
ALTER TABLE "schedules" DROP COLUMN "operatorId",
ADD COLUMN     "creatorId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
