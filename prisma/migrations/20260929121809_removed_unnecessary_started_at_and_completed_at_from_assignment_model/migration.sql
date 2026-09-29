/*
  Warnings:

  - You are about to drop the column `completedAt` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `assignments` table. All the data in the column will be lost.
  - You are about to drop the column `isFailed` on the `servicerequests` table. All the data in the column will be lost.
  - You are about to drop the column `isRejected` on the `servicerequests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "assignments" DROP COLUMN "completedAt",
DROP COLUMN "startedAt";

-- AlterTable
ALTER TABLE "servicerequests" DROP COLUMN "isFailed",
DROP COLUMN "isRejected";
