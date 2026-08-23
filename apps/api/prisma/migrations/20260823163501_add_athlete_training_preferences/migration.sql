-- AlterTable
ALTER TABLE "AthleteProfile" ADD COLUMN     "preferredPrescriptionCategoryId" TEXT,
ADD COLUMN     "preferredWorkoutLevelId" TEXT;

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_preferredWorkoutLevelId_fkey" FOREIGN KEY ("preferredWorkoutLevelId") REFERENCES "WorkoutLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_preferredPrescriptionCategoryId_fkey" FOREIGN KEY ("preferredPrescriptionCategoryId") REFERENCES "PrescriptionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
