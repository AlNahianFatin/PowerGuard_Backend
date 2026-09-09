-- DropForeignKey
ALTER TABLE "areas" DROP CONSTRAINT "areas_feederId_fkey";

-- DropForeignKey
ALTER TABLE "feeders" DROP CONSTRAINT "feeders_substationId_fkey";

-- DropForeignKey
ALTER TABLE "substations" DROP CONSTRAINT "substations_zoneId_fkey";

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_feederId_fkey" FOREIGN KEY ("feederId") REFERENCES "feeders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feeders" ADD CONSTRAINT "feeders_substationId_fkey" FOREIGN KEY ("substationId") REFERENCES "substations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "substations" ADD CONSTRAINT "substations_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "distributionzones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
