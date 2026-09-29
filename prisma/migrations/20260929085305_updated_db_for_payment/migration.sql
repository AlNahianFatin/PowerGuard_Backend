/*
  Warnings:

  - You are about to drop the column `outageReportId` on the `assignments` table. All the data in the column will be lost.
  - The `paidAt` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `refundedAt` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `outagereports` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[operatorId,technicianId,serviceRequestId]` on the table `assignments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `serviceRequestId` to the `assignments` table without a default value. This is not possible if the table is not empty.
  - Made the column `operatorId` on table `assignments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `technicianId` on table `assignments` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('PENDING', 'ASSIGNED', 'INSPECTING', 'PAYMENTPENDING', 'INPROGRESS', 'RESOLVED', 'FAILED', 'REJECTED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_outageReportId_fkey";

-- DropForeignKey
ALTER TABLE "outagereports" DROP CONSTRAINT "outagereports_areaId_fkey";

-- DropForeignKey
ALTER TABLE "outagereports" DROP CONSTRAINT "outagereports_customerId_fkey";

-- DropForeignKey
ALTER TABLE "outagereports" DROP CONSTRAINT "outagereports_deletedBy_fkey";

-- DropIndex
DROP INDEX "assignments_operatorId_technicianId_outageReportId_key";

-- AlterTable
ALTER TABLE "assignments" DROP COLUMN "outageReportId",
ADD COLUMN     "serviceRequestId" TEXT NOT NULL,
ALTER COLUMN "operatorId" SET NOT NULL,
ALTER COLUMN "technicianId" SET NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "paidAt",
ADD COLUMN     "paidAt" TIMESTAMP(3),
DROP COLUMN "refundedAt",
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "outagereports";

-- DropEnum
DROP TYPE "OutageReportStatus";

-- CreateTable
CREATE TABLE "servicerequests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "isFailed" BOOLEAN NOT NULL DEFAULT false,
    "failureNote" TEXT,
    "isRejected" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "assignedAt" TIMESTAMP(3),
    "inspectedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "customerId" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,

    CONSTRAINT "servicerequests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technicianreports" (
    "id" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "charge" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "assignmentId" TEXT NOT NULL,

    CONSTRAINT "technicianreports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "servicerequests_status_idx" ON "servicerequests"("status");

-- CreateIndex
CREATE INDEX "servicerequests_customerId_idx" ON "servicerequests"("customerId");

-- CreateIndex
CREATE INDEX "servicerequests_areaId_idx" ON "servicerequests"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_operatorId_technicianId_serviceRequestId_key" ON "assignments"("operatorId", "technicianId", "serviceRequestId");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "servicerequests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicerequests" ADD CONSTRAINT "servicerequests_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicerequests" ADD CONSTRAINT "servicerequests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicerequests" ADD CONSTRAINT "servicerequests_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technicianreports" ADD CONSTRAINT "technicianreports_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technicianreports" ADD CONSTRAINT "technicianreports_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
