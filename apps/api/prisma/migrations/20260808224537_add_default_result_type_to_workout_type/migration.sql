-- AlterTable
ALTER TABLE "WorkoutType" ADD COLUMN     "defaultResultTypeId" TEXT;

-- AddForeignKey
ALTER TABLE "WorkoutType" ADD CONSTRAINT "WorkoutType_defaultResultTypeId_fkey" FOREIGN KEY ("defaultResultTypeId") REFERENCES "ResultType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
