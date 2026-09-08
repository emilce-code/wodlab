-- CreateTable
CREATE TABLE "CoachGroup" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CoachGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "athleteProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoachGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramTemplate" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgramTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramTemplateItem" (
    "id" TEXT NOT NULL,
    "programTemplateId" TEXT NOT NULL,
    "dayOffset" INTEGER NOT NULL,
    "workoutId" TEXT NOT NULL,
    "workoutVariantId" TEXT NOT NULL,
    "prescriptionCategoryId" TEXT,
    "coachNotes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgramTemplateItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CoachGroup_coachProfileId_name_key" ON "CoachGroup"("coachProfileId", "name");
CREATE INDEX "CoachGroup_coachProfileId_idx" ON "CoachGroup"("coachProfileId");
CREATE UNIQUE INDEX "CoachGroupMember_groupId_athleteProfileId_key" ON "CoachGroupMember"("groupId", "athleteProfileId");
CREATE INDEX "CoachGroupMember_athleteProfileId_idx" ON "CoachGroupMember"("athleteProfileId");
CREATE UNIQUE INDEX "ProgramTemplate_coachProfileId_name_key" ON "ProgramTemplate"("coachProfileId", "name");
CREATE INDEX "ProgramTemplate_coachProfileId_idx" ON "ProgramTemplate"("coachProfileId");
CREATE INDEX "ProgramTemplateItem_programTemplateId_dayOffset_sortOrder_idx" ON "ProgramTemplateItem"("programTemplateId", "dayOffset", "sortOrder");

ALTER TABLE "CoachGroup" ADD CONSTRAINT "CoachGroup_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachGroupMember" ADD CONSTRAINT "CoachGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CoachGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachGroupMember" ADD CONSTRAINT "CoachGroupMember_athleteProfileId_fkey" FOREIGN KEY ("athleteProfileId") REFERENCES "AthleteProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgramTemplate" ADD CONSTRAINT "ProgramTemplate_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "CoachProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgramTemplateItem" ADD CONSTRAINT "ProgramTemplateItem_programTemplateId_fkey" FOREIGN KEY ("programTemplateId") REFERENCES "ProgramTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgramTemplateItem" ADD CONSTRAINT "ProgramTemplateItem_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgramTemplateItem" ADD CONSTRAINT "ProgramTemplateItem_workoutVariantId_fkey" FOREIGN KEY ("workoutVariantId") REFERENCES "WorkoutVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgramTemplateItem" ADD CONSTRAINT "ProgramTemplateItem_prescriptionCategoryId_fkey" FOREIGN KEY ("prescriptionCategoryId") REFERENCES "PrescriptionCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
