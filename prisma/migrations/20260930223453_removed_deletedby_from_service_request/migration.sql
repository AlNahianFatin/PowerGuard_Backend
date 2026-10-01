/*
  Warnings:

  - You are about to drop the column `deletedBy` on the `servicerequests` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "servicerequests" DROP CONSTRAINT "servicerequests_deletedBy_fkey";

-- AlterTable
ALTER TABLE "servicerequests" DROP COLUMN "deletedBy";
