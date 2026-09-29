/*
  Warnings:

  - A unique constraint covering the columns `[serviceRequestId]` on the table `assignments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "assignments_serviceRequestId_key" ON "assignments"("serviceRequestId");
