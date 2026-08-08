/*
  Warnings:

  - You are about to drop the column `measurementTypeId` on the `Movement` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Movement" DROP CONSTRAINT "Movement_measurementTypeId_fkey";

-- AlterTable
ALTER TABLE "Movement" DROP COLUMN "measurementTypeId";

-- CreateTable
CREATE TABLE "MovementMeasurementType" (
    "movementId" TEXT NOT NULL,
    "measurementTypeId" TEXT NOT NULL,

    CONSTRAINT "MovementMeasurementType_pkey" PRIMARY KEY ("movementId","measurementTypeId")
);

-- AddForeignKey
ALTER TABLE "MovementMeasurementType" ADD CONSTRAINT "MovementMeasurementType_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementMeasurementType" ADD CONSTRAINT "MovementMeasurementType_measurementTypeId_fkey" FOREIGN KEY ("measurementTypeId") REFERENCES "MeasurementType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
