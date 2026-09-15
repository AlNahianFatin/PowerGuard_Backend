/*
  Warnings:

  - You are about to drop the column `feederId` on the `outagereports` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `outagereports` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "outagereports" DROP CONSTRAINT "outagereports_feederId_fkey";

-- AlterTable
ALTER TABLE "outagereports" DROP COLUMN "feederId",
DROP COLUMN "verifiedAt",
ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "failureNote" TEXT,
ADD COLUMN     "isFailed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "resolvedAt" DROP NOT NULL;
