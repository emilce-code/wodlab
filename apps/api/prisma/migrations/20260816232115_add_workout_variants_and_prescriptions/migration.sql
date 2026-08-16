/*
  Warnings:

  - You are about to drop the column `isRx` on the `WorkoutResult` table. All the data in the column will be lost.
  - You are about to drop the column `workoutId` on the `WorkoutSection` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[variantId,order]` on the table `WorkoutSection` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workoutVariantId` to the `WorkoutResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `WorkoutSection` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "WorkoutSection" DROP CONSTRAINT "WorkoutSection_workoutId_fkey";

-- DropIndex
DROP INDEX "WorkoutSection_workoutId_order_key";

-- AlterTable
ALTER TABLE "WorkoutResult" DROP COLUMN "isRx",
ADD COLUMN     "prescriptionCategoryId" TEXT,
ADD COLUMN     "workoutVariantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkoutSection" DROP COLUMN "workoutId",
ADD COLUMN     "variantId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "WorkoutLevel" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutVariant" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "name" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionCategory" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrescriptionCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutMovementPrescription" (
    "id" TEXT NOT NULL,
    "workoutMovementId" TEXT NOT NULL,
    "prescriptionCategoryId" TEXT NOT NULL,
    "reps" INTEGER,
    "weight" DECIMAL(65,30),
    "weightUnit" "WeightUnit",
    "distance" INTEGER,
    "calories" INTEGER,
    "durationSeconds" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutMovementPrescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutLevel_key_key" ON "WorkoutLevel"("key");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutVariant_workoutId_levelId_key" ON "WorkoutVariant"("workoutId", "levelId");

-- CreateIndex
CREATE UNIQUE INDEX "PrescriptionCategory_key_key" ON "PrescriptionCategory"("key");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutMovementPrescription_workoutMovementId_prescriptionC_key" ON "WorkoutMovementPrescription"("workoutMovementId", "prescriptionCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSection_variantId_order_key" ON "WorkoutSection"("variantId", "order");

-- AddForeignKey
ALTER TABLE "WorkoutSection" ADD CONSTRAINT "WorkoutSection_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "WorkoutVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutResult" ADD CONSTRAINT "WorkoutResult_workoutVariantId_fkey" FOREIGN KEY ("workoutVariantId") REFERENCES "WorkoutVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutResult" ADD CONSTRAINT "WorkoutResult_prescriptionCategoryId_fkey" FOREIGN KEY ("prescriptionCategoryId") REFERENCES "PrescriptionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutVariant" ADD CONSTRAINT "WorkoutVariant_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutVariant" ADD CONSTRAINT "WorkoutVariant_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "WorkoutLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutMovementPrescription" ADD CONSTRAINT "WorkoutMovementPrescription_workoutMovementId_fkey" FOREIGN KEY ("workoutMovementId") REFERENCES "WorkoutMovement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutMovementPrescription" ADD CONSTRAINT "WorkoutMovementPrescription_prescriptionCategoryId_fkey" FOREIGN KEY ("prescriptionCategoryId") REFERENCES "PrescriptionCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
