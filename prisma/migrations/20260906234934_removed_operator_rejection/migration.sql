/*
  Warnings:

  - You are about to drop the column `rejectionReason` on the `operators` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `operators` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedBy` on the `operators` table. All the data in the column will be lost.
  - You are about to drop the column `verificationStatus` on the `operators` table. All the data in the column will be lost.
  - The `verificationStatus` column on the `technicians` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TechnicianVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "operators" DROP COLUMN "rejectionReason",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedBy",
DROP COLUMN "verificationStatus";

-- AlterTable
ALTER TABLE "technicians" DROP COLUMN "verificationStatus",
ADD COLUMN     "verificationStatus" "TechnicianVerificationStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "OperatorTechnicianVerificationStatus";
