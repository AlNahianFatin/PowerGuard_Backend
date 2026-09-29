/*
  Warnings:

  - A unique constraint covering the columns `[startDateTime,endDateTime,feederId]` on the table `schedules` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "schedules_startDateTime_endDateTime_key";

-- CreateIndex
CREATE INDEX "schedules_startDateTime_idx" ON "schedules"("startDateTime");

-- CreateIndex
CREATE INDEX "schedules_endDateTime_idx" ON "schedules"("endDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_startDateTime_endDateTime_feederId_key" ON "schedules"("startDateTime", "endDateTime", "feederId");
