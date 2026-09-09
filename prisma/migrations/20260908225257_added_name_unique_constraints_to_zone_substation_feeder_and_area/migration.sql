/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `areas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `distributionzones` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `feeders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `substations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "areas_name_key" ON "areas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "distributionzones_name_key" ON "distributionzones"("name");

-- CreateIndex
CREATE UNIQUE INDEX "feeders_name_key" ON "feeders"("name");

-- CreateIndex
CREATE UNIQUE INDEX "substations_name_key" ON "substations"("name");
