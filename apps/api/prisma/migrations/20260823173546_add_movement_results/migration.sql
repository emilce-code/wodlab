-- CreateTable
CREATE TABLE "MovementResult" (
    "id" TEXT NOT NULL,
    "movementId" TEXT NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "measurementTypeId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "reps" INTEGER,
    "load" DECIMAL(65,30),
    "weightUnit" "WeightUnit",
    "distance" INTEGER,
    "durationSeconds" INTEGER,
    "calories" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovementResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MovementResult_athleteProfileId_movementId_measurementTypeI_idx" ON "MovementResult"("athleteProfileId", "movementId", "measurementTypeId", "performedAt");

-- AddForeignKey
ALTER TABLE "MovementResult" ADD CONSTRAINT "MovementResult_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "Movement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementResult" ADD CONSTRAINT "MovementResult_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementResult" ADD CONSTRAINT "MovementResult_measurementTypeId_fkey" FOREIGN KEY ("measurementTypeId") REFERENCES "MeasurementType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
