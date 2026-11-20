/*
  Warnings:

  - The values [CANCELLED] on the enum `ScheduleStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScheduleStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED');
ALTER TABLE "public"."schedules" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "schedules" ALTER COLUMN "status" TYPE "ScheduleStatus_new" USING ("status"::text::"ScheduleStatus_new");
ALTER TYPE "ScheduleStatus" RENAME TO "ScheduleStatus_old";
ALTER TYPE "ScheduleStatus_new" RENAME TO "ScheduleStatus";
DROP TYPE "public"."ScheduleStatus_old";
ALTER TABLE "schedules" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;
