-- CreateEnum
CREATE TYPE "CoachAthleteStatus" AS ENUM ('PENDING', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "CoachProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachAthleteRelationship" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "status" "CoachAthleteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CoachAthleteRelationship_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ScheduledWorkout"
ADD COLUMN "assignedByCoachProfileId" TEXT,
ADD COLUMN "coachNotes" TEXT,
ADD COLUMN "coachFeedback" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");
CREATE UNIQUE INDEX "CoachAthleteRelationship_coachProfileId_athleteProfileId_key" ON "CoachAthleteRelationship"("coachProfileId", "athleteProfileId");
CREATE INDEX "CoachAthleteRelationship_athleteProfileId_status_idx" ON "CoachAthleteRelationship"("athleteProfileId", "status");
CREATE INDEX "CoachAthleteRelationship_coachProfileId_status_idx" ON "CoachAthleteRelationship"("coachProfileId", "status");
CREATE INDEX "ScheduledWorkout_assignedByCoachProfileId_scheduledDate_idx" ON "ScheduledWorkout"("assignedByCoachProfileId", "scheduledDate");

-- AddForeignKey
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachAthleteRelationship" ADD CONSTRAINT "CoachAthleteRelationship_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachAthleteRelationship" ADD CONSTRAINT "CoachAthleteRelationship_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledWorkout" ADD CONSTRAINT "ScheduledWorkout_assignedByCoachProfileId_fkey" FOREIGN KEY ("assignedByCoachProfileId") REFERENCES "CoachProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
