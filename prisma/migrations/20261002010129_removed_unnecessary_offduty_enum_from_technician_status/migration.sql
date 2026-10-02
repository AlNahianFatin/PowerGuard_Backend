/*
  Warnings:

  - The values [OFFDUTY] on the enum `TechnicianStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TechnicianStatus_new" AS ENUM ('AVAILABLE', 'ASSIGNED');
ALTER TABLE "public"."technicians" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "technicians" ALTER COLUMN "status" TYPE "TechnicianStatus_new" USING ("status"::text::"TechnicianStatus_new");
ALTER TYPE "TechnicianStatus" RENAME TO "TechnicianStatus_old";
ALTER TYPE "TechnicianStatus_new" RENAME TO "TechnicianStatus";
DROP TYPE "public"."TechnicianStatus_old";
ALTER TABLE "technicians" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;
