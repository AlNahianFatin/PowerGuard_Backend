-- AlterTable
ALTER TABLE "servicerequests" ADD COLUMN     "rejectedBy" TEXT;

-- AddForeignKey
ALTER TABLE "servicerequests" ADD CONSTRAINT "servicerequests_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
