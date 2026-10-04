/*
  Warnings:

  - You are about to drop the column `customerId` on the `payments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_customerId_fkey";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "customerId";
